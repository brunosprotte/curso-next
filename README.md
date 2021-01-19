# NextJS

```bash
#criando um projeto com NextJS
yarn create next-app projetct-name

# adicionando typescript
yarn add typescript @types/react @types/node

#ao iniciar o projeto (yarn dev) os arquivos de configuração do typescript serão criados automaticamente
```

O Next faz o mesmo que create-react-app porém com algumas vantagens

- uma das principais é o server-side-rendering
- hot-reload que permite a edição de arquivos sem fazer reload na página, isso mantém o estado da aplicação

# Rotas

Por padrão o NextJS cria as rotas com base no conteúdo da pasta *pages, a pasta,* esta pasta pode ficar na raiz do projeto ou dentro da pasta *src*

Arquivos que inicial com _ (underline) são ignorados;

Deve-se manter um arquivo nomeado como *index* que será a raiz da aplicação

As rotas serão montadas com base no nome das pastas e arquivos

```bash
|-src/
	|-pages/
		|-index.tsx #raiz da aplicação
		|-catalog/
			|-products/
				|-product.tsx
				|-_product_1.tsx #arquivo ignorado no roteamento
```

A estrutura acima resultará na seguinte rota: /catalog/products/product

# Rotas dinâmicas

É possível criar rotas dinâmicas nomeando os arquivos com [parametro].tsx

Ao usar este recurso, *query-param* será armazenado dentro de um parâmetro que terá como nome o valor passado dentro dos colchetes no nome do arquivo

Exemplo:

```bash
|-src/
	|-pages/
		|-catalog/
			|-products/
				|-[batata].tsx
```

A estrutura acima resultará na seguinte rota: /catalog/products/**camiseta-branca**

**camiseta-branca-hearing** ficará disponível dentro de um objeto nomeado como **batata**

```tsx
//batata.tsx

import {useRouter} from 'next/router';

export default function Product(){
    const router = useRouter();
    
    return <h1>{router.query.batata}</h1>
}
```

# Styled-Components SSR

Algumas configurações adicionais são necessárias para utilizar *styled-components* com *server-side-rendering*

Documentação: [https://styled-components.com/docs/advanced#server-side-rendering](https://styled-components.com/docs/advanced#server-side-rendering)

Adicionar o *babel.config.js* na raiz do projeto

```jsx
module.exports = {
  presets: ["next/babel"],
  plugins: [["styled-components", { "ssr": true }]]
}
```

Adicionar o arquivo *_document.tsx* na pasta pages

```tsx
import Document, {DocumentContext} from 'next/document'
import { ServerStyleSheet } from 'styled-components'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet()
    const originalRenderPage = ctx.renderPage

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        })

      const initialProps = await Document.getInitialProps(ctx)
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      }
    } finally {
      sheet.seal()
    }
  }
}
```

# Fetch de informações SSR

Usando *GetServerSideProps* é possível fazer a resquest com SSR antes de devolver o conteúdo para o browser, porém, a página não será carregada até que a requisição seja terminada

```tsx
//Componente recebe informações durante o SSR
export default function Home({recommendedProducts}: HomeProps) {}

// Função para buscar informações com SSR
export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const response = await fetch('http://localhost:3333/recommended');
  const recommendedProducts = await response.json();
      
  return {
    props: {
      recommendedProducts
    }
  }
}
```

# Gerando páginas estáticas

O NextJS permite a criação de páginas estáticas no momento do build, para isso, as requisições existentes na página serão executadas em uma das etapas de build e uma página já populada com o conteúdo será criada

```tsx
export default function Top10({ products }: Top10Props) {}

/* 
 * GetStaticProps faz com que esta página seja gerada como um HTML 
 * estático no momento do build, isto é, as requisições serão feitas durante o build
 * o parâmetro **revalidate** no objeto de retorno indica a periodicidade (em segundos)
 * de reconstrução desta página
 */ 
export const getStaticProps: GetStaticProps<Top10Props> = async (context) => {
    const response = await fetch('http://localhost:3333/products');
    const products = await response.json();

    return {
        props: {products},
				revalidate: 5, // em segundos
    }
}

$ yarn build
yarn run v1.22.5
$ next build
info  - Using external babel configuration from /home/bsprotte/nextJS/curso-next/babel.config.js
info  - Creating an optimized production build  
info  - Compiled successfully
info  - Collecting page data  
info  - Generating static pages (4/4)
info  - Finalizing page optimization  

Page                                                           Size     First Load JS
┌ λ /                                                          449 B          77.1 kB
├   /_app                                                      0 B            76.7 kB
├ ○ /404                                                       3.46 kB        80.1 kB
├ ○ /catalog/products/[batata]                                 304 B            77 kB
├ ○ /search                                                    277 B          76.9 kB
└ ● /top10 (ISR: 10 Seconds)                                   354 B            77 kB
+ First Load JS shared by all                                  76.7 kB
  ├ chunks/71247caf95475e3ea7f9a0f8a30beb258b23d005.a79bd7.js  13.7 kB
  ├ chunks/cb03562e3ebc8ed3fd6d7f07d8b3ec8f7e78d938.d4f570.js  13.1 kB
  ├ chunks/framework.abffcf.js                                 41.8 kB
  ├ chunks/main.2ae66b.js                                      6.62 kB
  ├ chunks/pages/_app.34f417.js                                733 B
  └ chunks/webpack.50bee0.js                                   751 B

λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
○  (Static)  automatically rendered as static HTML (uses no initial props)
●  (SSG)     automatically generated as static HTML + JSON (uses getStaticProps)
   (ISR)     incremental static regeneration (uses revalidate in getStaticProps)

Done in 6.94s.
```

# Gerando páginas estáticas de páginas dinâmicas

É possível utilizar o recurso de páginas estáticas em conjunto com páginas dinâmicas.

Para isso, é necessário informar ao NextJS quais são os possíveis parâmetros que podem ser recebidos;

No momento do build o NextJS irá executar o método *GetStaticPaths* para resolver os parâmetros e depois o *GetStaticProps* para cada um dos parâmetros, resultando em uma página estática para cada *Path*

```tsx
export default function Category({ products }: CategoryProps) {}

/*
 * o retorno de GetStaticPaths deve conter o parâmetro usado no nome da página,
 * neste caso, **slug,** perceba que ele é usado na request em GetStaticProps
 */
export const getStaticPaths: GetStaticPaths = async () => {
    const response = await fetch('http://localhost:3333/categories');
    const categories = await response.json();

    const paths = categories.map(category => {
        return {
            params: {slug: category.id}
        }
    })

    return {
        paths, // 
        fallback: false,
    }
}

export const getStaticProps: GetStaticProps<CategoryProps> = async (context) => {
    const {slug} = context.params;

    const response = await fetch(`http://localhost:3333/products?category_id=${slug}`);
    const products = await response.json();

    return {
        props: {products},
        revalidate: 60,
    }
}

$ yarn build
yarn run v1.22.5
$ next build
info  - Using external babel configuration from /home/bsprotte/nextJS/curso-next/babel.config.js
info  - Creating an optimized production build  
info  - Compiled successfully
info  - Collecting page data  
info  - Generating static pages (6/6)
info  - Finalizing page optimization  

Page                                                           Size     First Load JS
┌ λ /                                                          449 B          77.1 kB
├   /_app                                                      0 B            76.7 kB
├ ○ /404                                                       3.46 kB        80.1 kB
├ ● /catalog/catagories/[slug]                                 372 B            77 kB
├   ├ /catalog/catagories/camisetas
├   └ /catalog/catagories/calcas
├ ○ /catalog/products/[batata]                                 304 B            77 kB
├ ○ /search                                                    277 B          76.9 kB
└ ● /top10 (ISR: 10 Seconds)                                   354 B            77 kB
+ First Load JS shared by all                                  76.7 kB
  ├ chunks/71247caf95475e3ea7f9a0f8a30beb258b23d005.a79bd7.js  13.7 kB
  ├ chunks/d3643daa1b71db820afbaec8ab3c56886df430c7.d4f570.js  13.1 kB
  ├ chunks/framework.abffcf.js                                 41.8 kB
  ├ chunks/main.2ae66b.js                                      6.62 kB
  ├ chunks/pages/_app.34f417.js                                733 B
  └ chunks/webpack.50bee0.js                                   751 B

λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
○  (Static)  automatically rendered as static HTML (uses no initial props)
●  (SSG)     automatically generated as static HTML + JSON (uses getStaticProps)
   (ISR)     incremental static regeneration (uses revalidate in getStaticProps)

Done in 7.00s.
```