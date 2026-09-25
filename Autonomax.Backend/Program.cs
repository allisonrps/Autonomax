using Autonomax.Backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Text.Json.Serialization; //IgnoreCycles
using Microsoft.AspNetCore.HttpOverrides;

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURAÇÃO DA STRING DE CONEXÃO (RAILWAY + SUPABASE) ---
var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") 
                      ?? Environment.GetEnvironmentVariable("DefaultConnection")
                      ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Não definido";
    throw new Exception($"ERRO: Connection String vazia. Ambiente: {env}");
}

// --- SERVIÇOS DE BANCO DE DADOS (POSTGRESQL) ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions => 
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null);
    }));

// --- SEGURANÇA (JWT) ---
var secretKey = Autonomax.Backend.Services.TokenService.ObterChaveSecret(builder.Configuration);
var chave = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(chave),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// --- SWAGGER ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header usando o esquema Bearer. Exemplo: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// --- RATE LIMITING ---
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login_policy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });

    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// --- POLÍTICA DE CORS (DINÂMICA E PERMISSIVA PARA VERCEL, LOCALHOST E DISPOSITIVOS) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// --- FORWARDED HEADERS (RAILWAY / REVERSE PROXY) ---
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// --- CONFIGURAÇÃO DE CONTROLLERS (RESOLVE ERRO 400 E 500) ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Aceita 'email' vindo do front mesmo que no DTO seja 'Email'
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true; 
        
        // Evita loops infinitos em relacionamentos
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        
        // Opcional: Ignora campos nulos para deixar o JSON mais limpo
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

var app = builder.Build();

// --- MIDDLEWARE E PIPELINE (ORDEM CRÍTICA) ---
// 1. Respeita os cabeçalhos do proxy reverso da Railway (X-Forwarded-For, X-Forwarded-Proto)
app.UseForwardedHeaders();

// 2. CORS OBRIGATORIAMENTE no topo para responder preflight (OPTIONS) antes de qualquer middleware
app.UseCors("FrontendPolicy");

// 3. Short-circuit para requisições de preflight OPTIONS (evita redirecionamentos 307 e erros de CORS)
app.Use(async (context, next) =>
{
    if (context.Request.Method == "OPTIONS")
    {
        var origin = context.Request.Headers["Origin"].ToString();
        context.Response.Headers["Access-Control-Allow-Origin"] = string.IsNullOrEmpty(origin) ? "*" : origin;
        context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
        context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin";
        context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
        context.Response.StatusCode = 200;
        await context.Response.CompleteAsync();
        return;
    }
    await next();
});

// 4. Error Handling captura exceções das rotas subsequentes garantindo resposta JSON com CORS
app.UseMiddleware<Autonomax.Backend.Middleware.ErrorHandlingMiddleware>();

// 5. Security Headers HTTP
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});

app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection(); // Removido para evitar redirecionamento HTTP 307 no proxy da Railway que quebra CORS Preflight
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// 6. AuditMiddleware roda após processar o controller sem travar a resposta
app.UseMiddleware<Autonomax.Backend.Middleware.AuditMiddleware>();

app.MapControllers();

// --- INICIALIZAÇÃO DE DADOS ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    
    // Garante que o esquema do Supabase esteja atualizado
    try
    {
        context.Database.EnsureCreated();

        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ""ProdutosServicos"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""Nome"" text NOT NULL,
                ""Descricao"" text NULL,
                ""Categoria"" text NULL,
                ""Preco"" numeric(18,2) NOT NULL DEFAULT 0.0,
                ""EhServico"" boolean NOT NULL DEFAULT FALSE,
                ""DataCriacao"" timestamp without time zone NOT NULL DEFAULT NOW(),
                ""NegocioId"" integer NOT NULL
            );

            ALTER TABLE ""ProdutosServicos"" ADD COLUMN IF NOT EXISTS ""Categoria"" text NULL;
            ALTER TABLE ""ProdutosServicos"" ADD COLUMN IF NOT EXISTS ""DataCriacao"" timestamp without time zone NOT NULL DEFAULT NOW();

            CREATE TABLE IF NOT EXISTS ""Fornecedores"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""Nome"" text NOT NULL,
                ""Telefone"" text NULL,
                ""Categoria"" text NULL,
                ""Observacoes"" text NULL,
                ""DataCriacao"" timestamp without time zone NOT NULL DEFAULT NOW(),
                ""NegocioId"" integer NOT NULL
            );

            ALTER TABLE ""Transacoes"" ADD COLUMN IF NOT EXISTS ""FornecedorId"" integer NULL;
            ALTER TABLE ""Negocios"" ADD COLUMN IF NOT EXISTS ""LogoUrl"" text NULL;

            CREATE TABLE IF NOT EXISTS ""HistoricoPrecosProdutos"" (
                ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                ""ProdutoServicoId"" integer NOT NULL,
                ""PrecoAntigo"" numeric(18,2) NOT NULL DEFAULT 0.0,
                ""PrecoNovo"" numeric(18,2) NOT NULL DEFAULT 0.0,
                ""DataAlteracao"" timestamp without time zone NOT NULL DEFAULT NOW(),
                ""Motivo"" text NULL,
                ""NegocioId"" integer NOT NULL
            );
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Aviso na verificação de tabelas: {ex.Message}");
    }
    
    Autonomax.Backend.Data.DbSeeder.Seed(context);
}

app.Run();