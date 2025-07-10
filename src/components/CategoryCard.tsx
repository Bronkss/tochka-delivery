import '../styles/components/CategoryCard.css'

interface CategoryCardProps {
    name?: string;
    imageUrl?: string;
    alt?: string;
}

function CategoryCard(props: CategoryCardProps) {
    return (
        <div className="category-card">
            <h3>{props.name}</h3>
            <img src={props.imageUrl} alt={props.alt} />
        </div>
    )
}

export default CategoryCard;