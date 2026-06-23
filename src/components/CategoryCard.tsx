import '../styles/components/CategoryCard.css'
import { Link } from 'react-router-dom'

interface CategoryCardProps {
    name?: string;
    imageUrl?: string;
    alt?: string;
    linkId?: string;
}

const DEFAULT_CATEGORY_IMAGE = '/category-images/other.png';

const CATEGORY_IMAGES: Record<string, string> = {
    'чай и кофе': '/category-images/tea-coffee.png',
    'консервы': '/category-images/canned-food.png',
    'заморозка': '/category-images/freezing.png',
    'соусы и приправы': '/category-images/sauces-seasonings.png',
    'молочные продукты': '/category-images/dairy-products.png',
    'безалкогольные напитки': '/category-images/soft-drinks.png',
    'рыба и морепродукты': '/category-images/fish-seafood.png',
    'кондитерка и сладости': '/category-images/sweets-pastry.png',
    'бакалея': '/category-images/grocery.png',
    'товары для дома': '/category-images/home-goods.png',
    'косметика и гигиена': '/category-images/cosmetics-hygiene.png',
    'овощи и фрукты': '/category-images/vegetables-fruits.png',
    'другое': '/category-images/other.png',
    'пиво': '/category-images/beer.png',
    'энергетики': '/category-images/energy-drinks.png',
    'колбасы и мясная охлажденная продукция': '/category-images/sausage-chilled-meat.png',
    'алкоголь': '/category-images/alcohol.png',
    'напитки': '/category-images/drinks.png',
    'замороженные продукты': '/category-images/frozen-products.png',
    'табачная продукция': '/category-images/tobacco.png',
    'соусы и специи': '/category-images/sauces-spices.png',
    'снеки': '/category-images/snacks.png',
    'рыба': '/category-images/fish.png',
    'молочная продукция': '/category-images/dairy.png',
    'красота и здоровье/парфюмерия': '/category-images/beauty-health-perfumery.png',
    'красота и здоровье/косметика': '/category-images/beauty-health-cosmetics.png',
    'безалкогольные напитки/энергетические напитки': '/category-images/soft-energy-drinks.png',
    'кондитерские изделия': '/category-images/confectionery.png',
    'канцелярия и хобби': '/category-images/stationery-hobby.png',
    'хозтовары': '/category-images/household-goods.png',
    'сладости': '/category-images/sweet.png',
    'прочее': '/category-images/misc.png',
    'снеки и бакалея': '/category-images/snacks-grocery.png',
    'мясо и колбаса': '/category-images/meat-sausage.png',
    'мясо и птица': '/category-images/meat-poultry.png',
};

function normalizeCategoryName(value?: string) {
    return (value ?? '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/\s*\/\s*/g, '/')
        .replace(/\s+/g, ' ')
        .trim();
}

function getCategoryImage(name?: string, imageUrl?: string) {
    const localImage = CATEGORY_IMAGES[normalizeCategoryName(name)];

    if (localImage) {
        return localImage;
    }

    return imageUrl?.trim() || DEFAULT_CATEGORY_IMAGE;
}

export default function CategoryCard(props: CategoryCardProps) {
    const imageSrc = getCategoryImage(props.name, props.imageUrl);
    const imageAlt = props.alt ?? props.name ?? 'Категория';

    return (
        <Link to={props.linkId ?? ''} className="category-card__link">
            <div className="category-card">
                <h3>{props.name}</h3>
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    loading="lazy"
                    onError={(event) => {
                        event.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
                    }}
                />
            </div>
        </Link>
    );
}
