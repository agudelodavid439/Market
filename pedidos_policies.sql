-- Política para permitir inserción de datos sin autenticación
CREATE POLICY pedidos_insert_policy
    ON pedidos
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Política para permitir eliminación de datos sin autenticación
CREATE POLICY pedidos_delete_policy
    ON pedidos
    FOR DELETE
    TO public
    USING (true);

-- Habilitar RLS (Row Level Security) en la tabla pedidos
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;