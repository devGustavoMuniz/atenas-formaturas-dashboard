# Documentação de API

Este documento descreve os endpoints necessários para o backend da aplicação.

## Autenticação

### Login

- **URL**: `/v2/auth/login`
- **Método**: `POST`
- **Corpo da Requisição**:
  \`\`\`json
  {
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }
  \`\`\`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "token": "jwt-token-aqui",
    "user": {
      "id": "user-1",
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "admin"
    }
  }
  \`\`\`

### Refresh Token

- **URL**: `/v2/auth/refresh`
- **Método**: `POST`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "token": "novo-jwt-token-aqui",
    "user": {
      "id": "user-1",
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "admin"
    }
  }
  \`\`\`

### Logout

- **URL**: `/v2/auth/logout`
- **Método**: `POST`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "success": true,
    "message": "Logout realizado com sucesso"
  }
  \`\`\`

## Usuários

### Listar Usuários

- **URL**: `/v2/users`
- **Método**: `GET`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Parâmetros de Consulta**:
  - `page`: Número da página (opcional)
  - `limit`: Limite de itens por página (opcional)
  - `search`: Termo de busca (opcional)
  - `institutionId`: Filtrar por instituição (opcional)
  - `role`: Filtrar por cargo (opcional)
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "data": [
      {
        "id": "user-1",
        "name": "Nome do Usuário",
        "email": "usuario@exemplo.com",
        "phone": "(11) 98765-4321",
        "role": "admin",
        "institutionId": "inst-1",
        "userContract": "CONT-1001"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
  \`\`\`

### Obter Usuário por ID

- **URL**: `/v2/users/{id}`
- **Método**: `GET`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "id": "user-1",
    "name": "Nome do Usuário",
    "identifier": "ID-1001",
    "email": "usuario@exemplo.com",
    "phone": "(11) 98765-4321",
    "observations": "Observações sobre o usuário",
    "role": "admin",
    "institutionId": "inst-1",
    "userContract": "CONT-1001",
    "fatherName": "Nome do Pai",
    "fatherPhone": "(11) 91234-5678",
    "motherName": "Nome da Mãe",
    "motherPhone": "(11) 98765-4321",
    "driveLink": "https://drive.google.com/...",
    "creditValue": 1000,
    "profileImage": "user-123.jpg",
    "createdAt": "2023-01-01T00:00:00Z"
  }
  \`\`\`

### Criar Usuário

- **URL**: `/v2/users`
- **Método**: `POST`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Corpo da Requisição**:
  \`\`\`json
  {
    "name": "Nome do Usuário",
    "identifier": "ID-1001",
    "email": "usuario@exemplo.com",
    "phone": "(11) 98765-4321",
    "observations": "Observações sobre o usuário",
    "password": "senha123",
    "role": "admin",
    "institutionId": "inst-1",
    "fatherName": "Nome do Pai",
    "fatherPhone": "(11) 91234-5678",
    "motherName": "Nome da Mãe",
    "motherPhone": "(11) 98765-4321",
    "driveLink": "https://drive.google.com/...",
    "creditValue": 1000,
    "profileImage": "user-123.jpg"
  }
  \`\`\`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "id": "user-1",
    "name": "Nome do Usuário",
    "identifier": "ID-1001",
    "email": "usuario@exemplo.com",
    "phone": "(11) 98765-4321",
    "observations": "Observações sobre o usuário",
    "role": "admin",
    "institutionId": "inst-1",
    "userContract": "CONT-1001",
    "fatherName": "Nome do Pai",
    "fatherPhone": "(11) 91234-5678",
    "motherName": "Nome da Mãe",
    "motherPhone": "(11) 98765-4321",
    "driveLink": "https://drive.google.com/...",
    "creditValue": 1000,
    "profileImage": "user-123.jpg",
    "createdAt": "2023-01-01T00:00:00Z"
  }
  \`\`\`

### Atualizar Usuário

- **URL**: `/v2/users/{id}`
- **Método**: `PUT`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Corpo da Requisição**:
  \`\`\`json
  {
    "name": "Nome do Usuário Atualizado",
    "identifier": "ID-1001",
    "email": "usuario@exemplo.com",
    "phone": "(11) 98765-4321",
    "observations": "Observações atualizadas",
    "password": "novaSenha123",
    "role": "admin",
    "institutionId": "inst-1",
    "fatherName": "Nome do Pai",
    "fatherPhone": "(11) 91234-5678",
    "motherName": "Nome da Mãe",
    "motherPhone": "(11) 98765-4321",
    "driveLink": "https://drive.google.com/...",
    "creditValue": 1500,
    "profileImage": "user-123-updated.jpg"
  }
  \`\`\`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "id": "user-1",
    "name": "Nome do Usuário Atualizado",
    "identifier": "ID-1001",
    "email": "usuario@exemplo.com",
    "phone": "(11) 98765-4321",
    "observations": "Observações atualizadas",
    "role": "admin",
    "institutionId": "inst-1",
    "userContract": "CONT-1001",
    "fatherName": "Nome do Pai",
    "fatherPhone": "(11) 91234-5678",
    "motherName": "Nome da Mãe",
    "motherPhone": "(11) 98765-4321",
    "driveLink": "https://drive.google.com/...",
    "creditValue": 1500,
    "profileImage": "user-123-updated.jpg",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-02T00:00:00Z"
  }
  \`\`\`

### Excluir Usuário

- **URL**: `/v2/users/{id}`
- **Método**: `DELETE`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "success": true,
    "message": "Usuário excluído com sucesso"
  }
  \`\`\`

### Obter URL Presigned para Upload de Imagem

- **URL**: `/v2/storage/presigned-url`
- **Método**: `POST`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Corpo da Requisição**:
  \`\`\`json
  {
    "contentType": "image/jpeg"
  }
  \`\`\`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "uploadUrl": "https://storage.googleapis.com/bucket-name/user-123.jpg",
    "filename": "user-123.jpg"
  }
  \`\`\`

## Instituições

### Listar Instituições

- **URL**: `/v2/institutions`
- **Método**: `GET`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Parâmetros de Consulta**:
  - `page`: Número da página (opcional)
  - `limit`: Limite de itens por página (opcional)
  - `search`: Termo de busca (opcional)
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "data": [
      {
        "id": "inst-1",
        "contractNumber": "CONT-1001",
        "name": "Nome da Instituição",
        "events": ["Evento 1", "Evento 2"],
        "userCount": 50,
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
  \`\`\`

### Obter Instituição por ID

- **URL**: `/v2/institutions/{id}`
- **Método**: `GET`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "id": "inst-1",
    "contractNumber": "CONT-1001",
    "name": "Nome da Instituição",
    "observations": "Observações sobre a instituição",
    "events": ["Evento 1", "Evento 2"],
    "userCount": 50,
    "createdAt": "2023-01-01T00:00:00Z"
  }
  \`\`\`

### Criar Instituição

- **URL**: `/v2/institutions`
- **Método**: `POST`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Corpo da Requisição**:
  \`\`\`json
  {
    "contractNumber": "CONT-1001",
    "name": "Nome da Instituição",
    "observations": "Observações sobre a instituição",
    "events": [
      { "name": "Evento 1" },
      { "name": "Evento 2" }
    ]
  }
  \`\`\`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "id": "inst-1",
    "contractNumber": "CONT-1001",
    "name": "Nome da Instituição",
    "observations": "Observações sobre a instituição",
    "events": ["Evento 1", "Evento 2"],
    "userCount": 0,
    "createdAt": "2023-01-01T00:00:00Z"
  }
  \`\`\`

### Atualizar Instituição

- **URL**: `/v2/institutions/{id}`
- **Método**: `PUT`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Corpo da Requisição**:
  \`\`\`json
  {
    "contractNumber": "CONT-1001",
    "name": "Nome da Instituição Atualizado",
    "observations": "Observações atualizadas",
    "events": [
      { "name": "Evento 1" },
      { "name": "Evento 2" },
      { "name": "Evento 3" }
    ]
  }
  \`\`\`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "id": "inst-1",
    "contractNumber": "CONT-1001",
    "name": "Nome da Instituição Atualizado",
    "observations": "Observações atualizadas",
    "events": ["Evento 1", "Evento 2", "Evento 3"],
    "userCount": 50,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-02T00:00:00Z"
  }
  \`\`\`

### Excluir Instituição

- **URL**: `/v2/institutions/{id}`
- **Método**: `DELETE`
- **Cabeçalhos**: `Authorization: Bearer {token}`
- **Resposta de Sucesso**:
  \`\`\`json
  {
    "success": true,
    "message": "Instituição excluída com sucesso"
  }
