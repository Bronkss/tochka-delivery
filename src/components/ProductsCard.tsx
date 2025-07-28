import addIcon from '../assets/icons/add-to-basket.svg'

interface ProductCardProps {
    title?: string;
    image?: string;
    weight?: string;
    price?: number;
}


export default function ProductsCard(props: ProductCardProps) {
    return (
        <div className="product-card">
            <div className="product-card__image-block">
                <img src={props.image} className="product-card__image"/>
            </div>
            <h3 className="products-card__title">{props.title}</h3>
            <span className="product-card__weight">{props.weight}</span>
            <div className="product-card__pay">
                <span className="product-card__pay__price">{props.price + " ₽"}</span>
                <button className="product-card__pay__add-to-basket"><img src={addIcon} /></button>
            </div>
        </div>
    )
}