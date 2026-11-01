# 4Ward — Frontend

Frontend do **4Ward**, uma plataforma para conectar pacientes e fisioterapeutas, permitindo busca de profissionais, gerenciamento de horários e agendamento de consultas.

## Tecnologias

- Next.js
- React
- TypeScript
- CSS Modules
- Bootstrap Icons

## Pré-requisitos

Antes de iniciar, tenha instalado:

- Node.js
- npm

Também é necessário que o **backend do 4Ward** esteja em execução em:

```text
http://localhost:3000/api
```

## Instalação

Clone o repositório e acesse a pasta do projeto:

```bash
git clone <URL_DO_REPOSITORIO>
cd 4Ward-Front
```

Instale as dependências:

```bash
npm install
```

## Executar o projeto

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:3001
```

## Build

Para gerar a versão de produção:

```bash
npm run build
```

Para executar a versão de produção:

```bash
npm start
```

## Funcionalidades

O frontend permite:

- cadastro e login de usuários;
- busca de fisioterapeutas;
- filtros por cidade, especialidade e modalidade;
- agendamento de consultas;
- acompanhamento e gerenciamento de consultas;
- gerenciamento da agenda do fisioterapeuta;
- edição de perfil;
- cadastro e edição do perfil profissional.