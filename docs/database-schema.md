# Modelagem do Banco de Dados

Este documento descreve a modelagem do banco de dados PostgreSQL para a aplicação.

## Tabelas

### users

Armazena informações dos usuários do sistema.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | UUID | PRIMARY KEY | Identificador único do usuário |
| name | VARCHAR(255) | NOT NULL | Nome completo do usuário |
| identifier | VARCHAR(50) | NOT NULL, UNIQUE | Identificador único do usuário (código interno) |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email do usuário |
| phone | VARCHAR(20) | NOT NULL | Número de telefone do usuário |
| observations | TEXT | | Observações sobre o usuário |
| password_hash | VARCHAR(255) | NOT NULL | Hash da senha do usuário |
| role | VARCHAR(20) | NOT NULL | Cargo do usuário (admin, client) |
| institution_id | UUID | NOT NULL, FOREIGN KEY | Referência à instituição do usuário |
| father_name | VARCHAR(255) | | Nome do pai do usuário |
| father_phone | VARCHAR(20) | | Telefone do pai do usuário |
| mother_name | VARCHAR(255) | | Nome da mãe do usuário |
| mother_phone | VARCHAR(20) | | Telefone da mãe do usuário |
| drive_link | VARCHAR(255) | | Link para pasta no Google Drive |
| credit_value | DECIMAL(10,2) | | Valor de crédito do usuário |
| profile_image | VARCHAR(255) | | Nome do arquivo da imagem de perfil |
| status | VARCHAR(20) | NOT NULL | Status do usuário (active, inactive) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data de criação do registro |
| updated_at | TIMESTAMP | | Data da última atualização do registro |

\`\`\`sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  identifier VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  observations TEXT,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'client')),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  father_name VARCHAR(255),
  father_phone VARCHAR(20),
  mother_name VARCHAR(255),
  mother_phone VARCHAR(20),
  drive_link VARCHAR(255),
  credit_value DECIMAL(10,2),
  profile_image VARCHAR(255),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_users_institution_id ON users(institution_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_identifier ON users(identifier);
\`\`\`

### institutions

Armazena informações das instituições.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | UUID | PRIMARY KEY | Identificador único da instituição |
| contract_number | VARCHAR(50) | NOT NULL, UNIQUE | Número do contrato da instituição |
| name | VARCHAR(255) | NOT NULL | Nome da instituição |
| observations | TEXT | | Observações sobre a instituição |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data de criação do registro |
| updated_at | TIMESTAMP | | Data da última atualização do registro |

\`\`\`sql
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  observations TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_institutions_contract_number ON institutions(contract_number);
\`\`\`

### institution_events

Armazena os eventos associados a cada instituição.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | UUID | PRIMARY KEY | Identificador único do evento |
| institution_id | UUID | NOT NULL, FOREIGN KEY | Referência à instituição |
| name | VARCHAR(255) | NOT NULL | Nome do evento |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data de criação do registro |
| updated_at | TIMESTAMP | | Data da última atualização do registro |

\`\`\`sql
CREATE TABLE institution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_institution_events_institution_id ON institution_events(institution_id);
\`\`\`

### refresh_tokens

Armazena tokens de atualização para autenticação.

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| id | UUID | PRIMARY KEY | Identificador único do token |
| user_id | UUID | NOT NULL, FOREIGN KEY | Referência ao usuário |
| token | VARCHAR(255) | NOT NULL, UNIQUE | Token de atualização |
| expires_at | TIMESTAMP | NOT NULL | Data de expiração do token |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Data de criação do registro |

\`\`\`sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
\`\`\`

## Relacionamentos

1. **users** → **institutions**:
   - Um usuário pertence a uma instituição
   - Uma instituição pode ter vários usuários

2. **institution_events** → **institutions**:
   - Um evento pertence a uma instituição
   - Uma instituição pode ter vários eventos

3. **refresh_tokens** → **users**:
   - Um token de atualização pertence a um usuário
   - Um usuário pode ter vários tokens de atualização

## Diagrama ER

\`\`\`mermaid
erDiagram
    INSTITUTIONS ||--o{ USERS : "has"
    INSTITUTIONS ||--o{ INSTITUTION_EVENTS : "has"
    USERS ||--o{ REFRESH_TOKENS : "has"

    INSTITUTIONS {
        UUID id PK
        VARCHAR contract_number UK
        VARCHAR name
        TEXT observations
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    USERS {
        UUID id PK
        VARCHAR name
        VARCHAR identifier UK
        VARCHAR email UK
        VARCHAR phone
        TEXT observations
        VARCHAR password_hash
        VARCHAR role
        UUID institution_id FK
        VARCHAR father_name
        VARCHAR father_phone
        VARCHAR mother_name
        VARCHAR mother_phone
        VARCHAR drive_link
        DECIMAL credit_value
        VARCHAR profile_image
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    INSTITUTION_EVENTS {
        UUID id PK
        UUID institution_id FK
        VARCHAR name
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    REFRESH_TOKENS {
        UUID id PK
        UUID user_id FK
        VARCHAR token UK
        TIMESTAMP expires_at
        TIMESTAMP created_at
    }
\`\`\`

## Índices

Para otimizar as consultas mais comuns, os seguintes índices foram criados:

1. **users**:
   - `idx_users_institution_id`: Para consultas que filtram usuários por instituição
   - `idx_users_email`: Para consultas de login e verificação de email
   - `idx_users_identifier`: Para consultas por identificador

2. **institutions**:
   - `idx_institutions_contract_number`: Para consultas por número de contrato

3. **institution_events**:
   - `idx_institution_events_institution_id`: Para consultas que buscam eventos de uma instituição

4. **refresh_tokens**:
   - `idx_refresh_tokens_user_id`: Para consultas que buscam tokens de um usuário
   - `idx_refresh_tokens_token`: Para validação de tokens

## Funções e Triggers

### Atualização automática de `updated_at`

\`\`\`sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutions_updated_at
BEFORE UPDATE ON institutions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institution_events_updated_at
BEFORE UPDATE ON institution_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
\`\`\`

## Considerações de Segurança

1. **Senhas**: As senhas são armazenadas como hashes usando algoritmos seguros (bcrypt ou Argon2).
2. **Autenticação**: Implementação de JWT para autenticação com tokens de curta duração e refresh tokens para renovação.
3. **Permissões**: Controle de acesso baseado em funções (RBAC) usando a coluna `role` na tabela `users`.
4. **Proteção contra SQL Injection**: Uso de consultas parametrizadas e ORM para evitar SQL injection.

## Estratégia de Backup

Recomenda-se configurar backups automáticos diários com retenção de pelo menos 30 dias. Os backups devem ser armazenados em locais geograficamente distribuídos para garantir a disponibilidade em caso de desastres.
