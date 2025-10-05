# Asteroid Impact Simulator

Um simulador de impacto de asteroides desenvolvido para o NASA Challenge, combinando visualização 3D interativa com cálculos científicos de impacto.

## 🚀 Como Executar o Projeto

### 1. Clonar o Repositório
```bash
git clone https://github.com/marcosschlick/meteor-madness.git
cd meteor-madness
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
# Copiar o arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env com suas configurações
# (Altere "your_api_key_here" pela sua chave da NASA)
```

**Arquivo .env:**
```env
SV_PORT=3000
NASA_API_KEY=your_api_key_here
```

### 4. Executar o Projeto
```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Ou modo produção
npm start
```

### 5. Acessar a Aplicação
Abra seu navegador e acesse:
```
http://localhost:3000
```

## 🔑 Obter Chave da NASA API

1. Acesse: https://api.nasa.gov/
2. Clique em "Sign Up" para criar uma conta
3. Preencha o formulário rapidamente
4. Você receberá uma chave API por email
5. Cole a chave no arquivo `.env` em `NASA_API_KEY=sua_chave_aqui`

*Caso não configure, será usada a DEMO_KEY da NASA (com limitações de uso).*

## 🛠 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript
- **Visualização 3D**: Three.js
- **Cálculos Científicos**: Decimal.js
- **API Externa**: NASA NeoWS

## 📋 Funcionalidades

- Simulação 3D interativa de impacto de asteroides
- Cálculos científicos de energia cinética, cratera e efeitos
- Seleção de local de impacto clicando no globo terrestre
- Visualização de resultados detalhados
- Integração com dados reais de asteroides da NASA

---

**Desenvolvido para o NASA Challenge 2025** 🚀
