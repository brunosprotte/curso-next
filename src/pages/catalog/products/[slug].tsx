import { GetStaticPaths, GetStaticProps } from "next"
import {useRouter} from 'next/router';
import { useState } from 'react';

import PrismicDOM  from 'prismic-dom'
import Prismic from 'prismic-javascript';
import { Document } from 'prismic-javascript/types/documents';
import { client } from '@/lib/prismic';

interface IProductProps{
    product: Document;
}

export default function Product({ product }: IProductProps) {
    const router = useRouter();

    if (router.isFallback) {
        return <p>Carregando...</p>
    }
    
    return (
        <div>
            <h1>
                {PrismicDOM.RichText.asText(product.data.title)}
            </h1>

            <img src={product.data.thumbnail.url} width="600" alt=""></img>

            <div dangerouslySetInnerHTML={{ __html: PrismicDOM.RichText.asText(product.data.description) }}></div>
            <p>Price: ${product.data.price}</p>


            
        </div>
    )
}

/**
 * parâmetro path vazio com fallback:true faz com que o NextJS crie 
 * a página estática sempre um produto que ainda não página estática seja acessado
 */
export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [],
        fallback: true,
    }
}

export const getStaticProps: GetStaticProps<IProductProps> = async (context) => {
    const {slug} = context.params;

    const product =  await client().getByUID('product', String(slug), {});

    return {
        props: {
            product
        },
        revalidate: 5,
    }
}