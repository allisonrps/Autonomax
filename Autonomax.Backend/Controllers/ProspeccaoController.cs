using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Autonomax.Backend.Security;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace Autonomax.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProspeccaoController : ControllerBase
{
    private readonly AppDbContext _context;
    private static readonly HttpClient _httpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(20)
    };

    public ProspeccaoController(AppDbContext context)
    {
        _context = context;
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "AutonomaxRadar/1.0 (contato@autonomax.com.br)");
            _httpClient.DefaultRequestHeaders.Add("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8");
        }
    }

    [HttpGet("buscar")]
    public async Task<IActionResult> BuscarLeads(
        [FromQuery] string cidade, 
        [FromQuery] string termo, 
        [FromHeader(Name = "X-Google-Key")] string? googleKey = null)
    {
        if (string.IsNullOrWhiteSpace(cidade) || string.IsNullOrWhiteSpace(termo))
        {
            return BadRequest(new { mensagem = "Informe a cidade e o segmento para buscar." });
        }

        var cidadeLimpa = cidade.Trim();
        var termoLimpo = termo.Trim();

        string? avisoGoogle = null;

        // 1. Se o usuário enviou uma chave da Google Places API, consulta no Google
        if (!string.IsNullOrWhiteSpace(googleKey))
        {
            var (leadsGoogle, erroGoogle) = await BuscarViaGooglePlacesAsync(cidadeLimpa, termoLimpo, googleKey.Trim());
            if (leadsGoogle.Count > 0)
            {
                return Ok(leadsGoogle);
            }

            if (!string.IsNullOrEmpty(erroGoogle))
            {
                avisoGoogle = erroGoogle;
                Console.WriteLine($"[Radar] Aviso/Erro Google Places: {erroGoogle}");
            }
        }

        // 2. Base pública oficial e aberta: OpenStreetMap (Nominatim)
        try
        {
            var leadsOsm = await BuscarViaNominatimAsync(cidadeLimpa, termoLimpo);
            if (leadsOsm.Count > 0)
            {
                return Ok(leadsOsm);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao consultar OpenStreetMap: {ex.Message}");
        }

        // Se o usuário forneceu a chave do Google e ela foi recusada, avisa com precisão
        if (!string.IsNullOrEmpty(avisoGoogle))
        {
            return BadRequest(new 
            { 
                mensagem = $"O Google Maps recusou a consulta: \"{avisoGoogle}\". Verifique se ativou a 'Places API' (ou 'Places API New') no Google Cloud Console e se há uma conta de faturamento (billing) vinculada." 
            });
        }

        return Ok(new List<LeadComercioDto>());
    }

    [HttpPost("importar-lote")]
    public async Task<IActionResult> ImportarLote([FromBody] ImportarLoteDto dto)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(dto.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado a este negócio." });
        }

        if (dto.Leads == null || dto.Leads.Count == 0)
        {
            return BadRequest(new { mensagem = "Nenhum lead informado para importação." });
        }

        int importados = 0;
        int ignoradosExistentes = 0;

        var clientesExistentes = await _context.Clientes
            .Where(c => c.NegocioId == dto.NegocioId)
            .Select(c => new { c.Nome, c.Celular })
            .ToListAsync();

        foreach (var lead in dto.Leads)
        {
            var telLimpo = Regex.Replace(lead.Telefone ?? "", @"\D", "");
            var nomeLimpo = (lead.Nome ?? "").Trim();

            bool jaExiste = clientesExistentes.Any(c => 
                (!string.IsNullOrEmpty(telLimpo) && Regex.Replace(c.Celular ?? "", @"\D", "") == telLimpo) ||
                string.Equals(c.Nome?.Trim(), nomeLimpo, StringComparison.OrdinalIgnoreCase)
            );

            if (jaExiste)
            {
                ignoradosExistentes++;
                continue;
            }

            var tags = string.Join(", ", new[] { "Radar", "Prospeccao", lead.Categoria, lead.Cidade }
                .Where(t => !string.IsNullOrWhiteSpace(t)));

            var novoCliente = new Cliente
            {
                Nome = nomeLimpo,
                Celular = telLimpo,
                Endereco = lead.Endereco ?? "",
                Cidade = lead.Cidade ?? "",
                Estado = lead.Estado ?? "SP",
                Observacoes = $"Lead captado via Radar em {DateTime.Now:dd/MM/yyyy}. Fonte: {lead.Origem}. Categoria: {lead.Categoria}.",
                Tags = tags,
                NegocioId = dto.NegocioId
            };

            _context.Clientes.Add(novoCliente);
            importados++;
        }

        if (importados > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new 
        { 
            importados, 
            ignoradosExistentes, 
            mensagem = $"{importados} clientes importados com sucesso! ({ignoradosExistentes} já estavam na sua carteira)" 
        });
    }

    [HttpGet("triagem/{negocioId}")]
    public async Task<IActionResult> ObterTriagem(int negocioId)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(negocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado a este negócio." });
        }

        var leads = await _context.LeadsTriagem
            .AsNoTracking()
            .Where(l => l.NegocioId == negocioId)
            .OrderByDescending(l => l.DataCaptura)
            .ToListAsync();

        return Ok(leads);
    }

    [HttpPost("salvar-triagem")]
    public async Task<IActionResult> SalvarTriagem([FromBody] ImportarLoteDto dto)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(dto.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado a este negócio." });
        }

        if (dto.Leads == null || dto.Leads.Count == 0)
        {
            return BadRequest(new { mensagem = "Nenhum lead informado para salvar na triagem." });
        }

        int salvos = 0;
        int ignorados = 0;

        var existentes = await _context.LeadsTriagem
            .Where(l => l.NegocioId == dto.NegocioId)
            .Select(l => new { l.Nome, l.Telefone })
            .ToListAsync();

        foreach (var lead in dto.Leads)
        {
            var telLimpo = Regex.Replace(lead.Telefone ?? "", @"\D", "");
            var nomeLimpo = (lead.Nome ?? "").Trim();

            bool jaExiste = existentes.Any(e =>
                (!string.IsNullOrEmpty(telLimpo) && Regex.Replace(e.Telefone ?? "", @"\D", "") == telLimpo) ||
                string.Equals(e.Nome.Trim(), nomeLimpo, StringComparison.OrdinalIgnoreCase)
            );

            if (jaExiste)
            {
                ignorados++;
                continue;
            }

            var novoLead = new LeadTriagem
            {
                Nome = nomeLimpo,
                Telefone = lead.Telefone,
                Endereco = lead.Endereco,
                Bairro = lead.Bairro,
                Cidade = lead.Cidade,
                Estado = lead.Estado ?? "SP",
                Categoria = lead.Categoria,
                GoogleMapsUrl = lead.GoogleMapsUrl,
                Site = lead.Site,
                Origem = lead.Origem ?? "Google Maps",
                Avaliacao = lead.Avaliacao,
                TotalAvaliacoes = lead.TotalAvaliacoes,
                Status = "Novo",
                Observacoes = $"Captado via Radar em {DateTime.Now:dd/MM/yyyy HH:mm}.",
                DataCaptura = DateTime.UtcNow,
                NegocioId = dto.NegocioId
            };

            _context.LeadsTriagem.Add(novoLead);
            salvos++;
        }

        if (salvos > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            salvos,
            ignorados,
            mensagem = $"{salvos} comércios salvos na Triagem com sucesso! ({ignorados} já estavam salvos)"
        });
    }

    [HttpPatch("triagem/{id}/status")]
    public async Task<IActionResult> AtualizarStatusTriagem(int id, [FromBody] AtualizarStatusLeadDto dto)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var lead = await _context.LeadsTriagem.FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound("Lead não encontrado.");

        if (!await _context.ValidarPosseNegocioAsync(lead.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado." });
        }

        lead.Status = dto.Status;
        if (!string.IsNullOrWhiteSpace(dto.Observacoes))
        {
            lead.Observacoes = dto.Observacoes;
        }

        if (dto.Status == "Contatado" || dto.Status == "Negociando")
        {
            lead.DataUltimoContato = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpPost("triagem/{id}/converter")]
    public async Task<IActionResult> ConverterLeadEmCliente(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var lead = await _context.LeadsTriagem.FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound("Lead não encontrado.");

        if (!await _context.ValidarPosseNegocioAsync(lead.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado." });
        }

        var telLimpo = Regex.Replace(lead.Telefone ?? "", @"\D", "");
        var nomeLimpo = (lead.Nome ?? "").Trim();

        // Verifica se já existe em Clientes
        var jaCliente = await _context.Clientes.AnyAsync(c =>
            c.NegocioId == lead.NegocioId &&
            ((!string.IsNullOrEmpty(telLimpo) && c.Celular == telLimpo) || c.Nome.ToLower() == nomeLimpo.ToLower())
        );

        if (!jaCliente)
        {
            var tags = string.Join(", ", new[] { "Radar", "Convertido", lead.Categoria, lead.Cidade }
                .Where(t => !string.IsNullOrWhiteSpace(t)));

            var novoCliente = new Cliente
            {
                Nome = nomeLimpo,
                Celular = telLimpo,
                Endereco = lead.Endereco ?? "",
                Cidade = lead.Cidade ?? "",
                Estado = lead.Estado ?? "SP",
                Observacoes = $"Convertido da Triagem do Radar em {DateTime.Now:dd/MM/yyyy}. {lead.Observacoes}",
                Tags = tags,
                NegocioId = lead.NegocioId
            };

            _context.Clientes.Add(novoCliente);
        }

        lead.Status = "Convertido";
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = $"Lead '{lead.Nome}' convertido com sucesso em Cliente Oficial da sua carteira!" });
    }

    [HttpDelete("triagem/{id}")]
    public async Task<IActionResult> ExcluirLeadTriagem(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var lead = await _context.LeadsTriagem.FirstOrDefaultAsync(l => l.Id == id);
        if (lead == null) return NotFound("Lead não encontrado.");

        if (!await _context.ValidarPosseNegocioAsync(lead.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado." });
        }

        _context.LeadsTriagem.Remove(lead);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Lead removido da triagem." });
    }

    private async Task<(List<LeadComercioDto> Leads, string? Erro)> BuscarViaGooglePlacesAsync(string cidade, string termo, string apiKey)
    {
        var lista = new List<LeadComercioDto>();
        string? ultimoErro = null;

        try
        {
            var urlNew = "https://places.googleapis.com/v1/places:searchText";
            var payload = new
            {
                textQuery = $"{termo} em {cidade}",
                languageCode = "pt-BR"
            };

            using var req = new HttpRequestMessage(HttpMethod.Post, urlNew);
            req.Headers.Add("X-Goog-Api-Key", apiKey);
            req.Headers.Add("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri");
            req.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

            var resp = await _httpClient.SendAsync(req);
            var jsonStr = await resp.Content.ReadAsStringAsync();

            if (resp.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(jsonStr);
                if (doc.RootElement.TryGetProperty("places", out var placesElement) && placesElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var p in placesElement.EnumerateArray())
                    {
                        string id = p.TryGetProperty("id", out var idE) ? idE.GetString() ?? Guid.NewGuid().ToString() : Guid.NewGuid().ToString();
                        string nome = "";
                        if (p.TryGetProperty("displayName", out var dispName) && dispName.TryGetProperty("text", out var textE))
                        {
                            nome = textE.GetString() ?? "";
                        }
                        if (string.IsNullOrWhiteSpace(nome)) continue;

                        string endereco = p.TryGetProperty("formattedAddress", out var addrE) ? addrE.GetString() ?? "" : "";
                        string telefone = p.TryGetProperty("nationalPhoneNumber", out var phoneE) ? phoneE.GetString() ?? "" : "";
                        double? rating = p.TryGetProperty("rating", out var ratE) ? ratE.GetDouble() : null;
                        int? userRatingsTotal = p.TryGetProperty("userRatingCount", out var countE) ? countE.GetInt32() : null;
                        string? website = p.TryGetProperty("websiteUri", out var webE) ? webE.GetString() : null;
                        string? mapsUrl = p.TryGetProperty("googleMapsUri", out var mapE) ? mapE.GetString() : null;

                        lista.Add(new LeadComercioDto
                        {
                            Id = id,
                            Nome = nome,
                            Telefone = telefone,
                            Endereco = endereco,
                            Cidade = cidade,
                            Estado = "SP",
                            Avaliacao = rating,
                            TotalAvaliacoes = userRatingsTotal,
                            Categoria = termo,
                            GoogleMapsUrl = mapsUrl ?? $"https://www.google.com/maps/search/?api=1&query={Uri.EscapeDataString(nome + " " + cidade)}",
                            Site = website,
                            Origem = "Google Maps"
                        });
                    }
                }

                return (lista, null);
            }
            else
            {
                try
                {
                    using var docErr = JsonDocument.Parse(jsonStr);
                    if (docErr.RootElement.TryGetProperty("error", out var errObj) && errObj.TryGetProperty("message", out var msgObj))
                    {
                        ultimoErro = msgObj.GetString();
                    }
                }
                catch { }

                if (string.IsNullOrWhiteSpace(ultimoErro))
                {
                    ultimoErro = $"Status {(int)resp.StatusCode} ({resp.ReasonPhrase}): {jsonStr}";
                }
            }
        }
        catch (Exception ex)
        {
            ultimoErro = ex.Message;
        }

        return (lista, ultimoErro);
    }

    private async Task<List<LeadComercioDto>> BuscarViaNominatimAsync(string cidade, string termo)
    {
        var lista = await ExecutarConsultaNominatimAsync($"{termo} {cidade}", cidade, termo);
        if (lista.Count == 0)
        {
            var termoSemAcento = RemoverAcentos(termo);
            if (termoSemAcento != termo)
            {
                lista = await ExecutarConsultaNominatimAsync($"{termoSemAcento} {cidade}", cidade, termo);
            }
        }
        if (lista.Count == 0)
        {
            lista = await ExecutarConsultaNominatimAsync($"{cidade}, {termo}", cidade, termo);
        }
        return lista;
    }

    private static string RemoverAcentos(string texto)
    {
        var normalized = texto.Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder();
        foreach (var c in normalized)
        {
            var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        return sb.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }

    private async Task<List<LeadComercioDto>> ExecutarConsultaNominatimAsync(string query, string cidadeOriginal, string termoOriginal)
    {
        var lista = new List<LeadComercioDto>();
        var url = $"https://nominatim.openstreetmap.org/search?q={Uri.EscapeDataString(query)}&format=json&addressdetails=1&extratags=1&limit=25";

        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Add("User-Agent", "AutonomaxRadar/1.0 (contato@autonomax.com.br)");

        var resp = await _httpClient.SendAsync(req);
        if (!resp.IsSuccessStatusCode) return lista;

        var jsonStr = await resp.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonStr);

        if (doc.RootElement.ValueKind != JsonValueKind.Array) return lista;

        foreach (var item in doc.RootElement.EnumerateArray())
        {
            string displayName = item.TryGetProperty("display_name", out var dn) ? dn.GetString() ?? "" : "";
            string nome = item.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            if (string.IsNullOrWhiteSpace(nome))
            {
                nome = displayName.Split(',').FirstOrDefault()?.Trim() ?? "";
            }
            if (string.IsNullOrWhiteSpace(nome)) continue;

            string rua = "";
            string numero = "";
            string bairro = "";
            string cid = cidadeOriginal;
            string uf = "SP";

            if (item.TryGetProperty("address", out var addr))
            {
                if (addr.TryGetProperty("road", out var r)) rua = r.GetString() ?? "";
                if (string.IsNullOrEmpty(rua) && addr.TryGetProperty("pedestrian", out var ped)) rua = ped.GetString() ?? "";
                if (addr.TryGetProperty("house_number", out var hn)) numero = hn.GetString() ?? "";
                if (addr.TryGetProperty("suburb", out var sub)) bairro = sub.GetString() ?? "";
                if (string.IsNullOrEmpty(bairro) && addr.TryGetProperty("neighbourhood", out var nei)) bairro = nei.GetString() ?? "";
                if (addr.TryGetProperty("city", out var c)) cid = c.GetString() ?? cidadeOriginal;
                else if (addr.TryGetProperty("town", out var t)) cid = t.GetString() ?? cidadeOriginal;
                if (addr.TryGetProperty("state", out var s)) uf = s.GetString() ?? "SP";
            }

            string telefone = "";
            string website = "";
            if (item.TryGetProperty("extratags", out var extra))
            {
                if (extra.TryGetProperty("phone", out var p)) telefone = p.GetString() ?? "";
                if (string.IsNullOrEmpty(telefone) && extra.TryGetProperty("contact:phone", out var cp)) telefone = cp.GetString() ?? "";
                if (string.IsNullOrEmpty(telefone) && extra.TryGetProperty("contact:mobile", out var cm)) telefone = cm.GetString() ?? "";
                if (string.IsNullOrEmpty(telefone) && extra.TryGetProperty("contact:whatsapp", out var cw)) telefone = cw.GetString() ?? "";
                if (extra.TryGetProperty("website", out var w)) website = w.GetString() ?? "";
                if (string.IsNullOrEmpty(website) && extra.TryGetProperty("contact:website", out var cw2)) website = cw2.GetString() ?? "";
            }

            var enderecoFormatado = string.Join(", ", new[] { rua + (string.IsNullOrEmpty(numero) ? "" : " " + numero), bairro, cid }
                .Where(x => !string.IsNullOrWhiteSpace(x)));

            if (string.IsNullOrWhiteSpace(enderecoFormatado))
            {
                enderecoFormatado = displayName;
            }

            lista.Add(new LeadComercioDto
            {
                Id = $"osm-{Guid.NewGuid()}",
                Nome = nome,
                Telefone = telefone,
                Endereco = enderecoFormatado,
                Bairro = bairro,
                Cidade = cid,
                Estado = uf,
                Avaliacao = null,
                TotalAvaliacoes = null,
                Categoria = termoOriginal,
                GoogleMapsUrl = $"https://www.google.com/maps/search/?api=1&query={Uri.EscapeDataString(nome + " " + (string.IsNullOrEmpty(bairro) ? cid : bairro + " " + cid))}",
                Site = website,
                Origem = "OpenStreetMap"
            });
        }

        return lista;
    }
}

public class LeadComercioDto
{
    public string Id { get; set; } = "";
    public string Nome { get; set; } = "";
    public string? Telefone { get; set; }
    public string? Endereco { get; set; }
    public string? Bairro { get; set; }
    public string Cidade { get; set; } = "";
    public string Estado { get; set; } = "SP";
    public double? Avaliacao { get; set; }
    public int? TotalAvaliacoes { get; set; }
    public string? Categoria { get; set; }
    public string? GoogleMapsUrl { get; set; }
    public string? Site { get; set; }
    public string Origem { get; set; } = "OpenStreetMap";
    public bool Importado { get; set; } = false;
}

public class ImportarLoteDto
{
    public int NegocioId { get; set; }
    public List<LeadComercioDto> Leads { get; set; } = new();
}

public class AtualizarStatusLeadDto
{
    public string Status { get; set; } = "Novo";
    public string? Observacoes { get; set; }
}
