using Autonomax.Backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURAÇÃO DA STRING DE CONEXÃO (RAILWAY + SUPABASE) ---
// Prioriza a variável de ambiente do Railway para evitar erro de LocalDB
// Tenta ler de três formas diferentes para garantir a captura no Railway
var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") 
                      ?? Environment.GetEnvironmentVariable("DefaultConnection")
                      ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    // nome do ambiente no erro para debug
    var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Não definido";
    throw new Exception($"ERRO: Connection String vazia. Ambiente: {env}");
}

// --- SERVIÇOS DE BANCO DE DADOS (POSTGRESQL) ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// --- SEGURANÇA (JWT) ---
var chave = Encoding.ASCII.GetBytes("Sua_Chave_Super_Secreta_De_32_Caracteres_Minimo");

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
        ValidateAudience = false
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

// --- POLÍTICA DE CORS (IMPORTANTE PARA VERCEL) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://autonomax.vercel.app") // Adicione sua URL da Vercel aqui [cite: 2026-02-25]
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// --- MIDDLEWARE E PIPELINE ---
app.UseMiddleware<Autonomax.Backend.Middleware.ErrorHandlingMiddleware>();

// Swagger habilitado em produção para facilitar seus testes iniciais
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("FrontendPolicy");

app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// --- INICIALIZAÇÃO DE DADOS (SEEDER) ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    
    // O Seeder agora roda com a conexão validada do Postgres [cite: 2026-02-25]
    Autonomax.Backend.Data.DbSeeder.Seed(context);
}

app.Run();