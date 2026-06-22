import '../styles/components/CategoryCard.css'
import { Link } from "react-router-dom"

interface CategoryCardProps {
    name?: string;
    imageUrl?: string;
    alt?: string;
    linkId?: string;
}

export default function CategoryCard(props: CategoryCardProps) {
    return (
        <Link to={props.linkId ?? ""} className="category-card__link">
            <div className="category-card">
                <h3>{props.name}</h3>
                <img src={props.imageUrl} alt={props.alt}/>
            </div>
        </Link>
    )
}