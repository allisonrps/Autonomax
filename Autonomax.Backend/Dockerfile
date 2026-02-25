# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copia os arquivos de projeto e restaura
COPY *.csproj ./
RUN dotnet restore

# Copia o restante e publica
COPY . ./
RUN dotnet publish -c Release -o out

# Estágio de Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/out .

# Comando para rodar a aplicação
ENTRYPOINT ["dotnet", "Autonomax.Backend.dll"]