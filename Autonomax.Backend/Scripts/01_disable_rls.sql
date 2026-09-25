-- ==============================================================================
-- SCRIPT DE SEGURANÇA POSTGRESQL / SUPABASE: DESATIVAR RLS NAS TABELAS DO SCHEMA PUBLIC
-- Para uso exclusivo com backend centralizado (.NET EF Core Connection String)
-- ==============================================================================

ALTER TABLE IF EXISTS public."Clientes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Fornecedores" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."HistoricoPrecosProdutos" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ItensTransacao" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."LogsSeguranca" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Negocios" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ProdutosServicos" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Transacoes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Usuarios" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."__EFMigrationsHistory" DISABLE ROW LEVEL SECURITY;
