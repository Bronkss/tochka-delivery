import "../styles/components/CategoryCard.css";
import { Link } from "react-router-dom";

interface CategoryCardProps {
    name?: string;
    imageUrl?: string;
    alt?: string;
    linkId?: string;
}

const DEFAULT_CATEGORY_IMAGE = "/category-images/other.svg";

const CATEGORY_IMAGES: Record<string, string> = {
    "чай и кофе": "/category-images/tea-coffee.svg",
    "консервы": "/category-images/canned-food.svg",
    "заморозка": "/category-images/freezing.svg",
    "соусы и приправы": "/category-images/sauces-seasonings.svg",
    "молочные продукты": "/category-images/dairy-products.svg",
    "безалкогольные напитки": "/category-images/soft-drinks.svg",
    "рыба и морепродукты": "/category-images/fish-seafood.svg",
    "кондитерка и сладости": "/category-images/sweets-pastry.svg",
    "бакалея": "/category-images/grocery.svg",
    "товары для дома": "/category-images/home-goods.svg",
    "косметика и гигиена": "/category-images/cosmetics-hygiene.svg",
    "овощи и фрукты": "/category-images/vegetables-fruits.svg",
    "другое": "/category-images/other.svg",

    "пиво": "/category-images/beer.svg",
    "энергетики": "/category-images/energy-drinks.svg",
    "колбасы и мясная охлажденная продукция": "/category-images/sausage-chilled-meat.svg",
    "алкоголь": "/category-images/alcohol.svg",
    "табачная продукция": "/category-images/tobacco.svg",
    "табачные изделия": "/category-images/tobacco.svg",
    "снеки": "/category-images/snacks.svg",
    "снэки": "/category-images/snacks.svg",
    "мясо и птица": "/category-images/meat-poultry.svg",

    "бытовая химия": "/category-images/household-chemicals.svg",
    "мороженое": "/category-images/ice-cream.svg",
    "хлебобулочные изделия": "/category-images/bakery-products.svg",

    // На случай опечатки в базе
    "хлеюобулочные изделия": "/category-images/bakery-products.svg",

    // Дополнительные алиасы из прошлых категорий
    "напитки": "/category-images/drinks.svg",
    "замороженные продукты": "/category-images/frozen-products.svg",
    "соусы и специи": "/category-images/sauces-spices.svg",
    "рыба": "/category-images/fish.svg",
    "молочная продукция": "/category-images/dairy.svg",
    "красота и здоровье/парфюмерия": "/category-images/beauty-health-perfumery.svg",
    "красота и здоровье/косметика": "/category-images/beauty-health-cosmetics.svg",
    "безалкогольные напитки/энергетические напитки": "/category-images/soft-energy-drinks.svg",
    "кондитерские изделия": "/category-images/confectionery.svg",
    "канцелярия и хобби": "/category-images/stationery-hobby.svg",
    "хозтовары": "/category-images/household-goods.svg",
    "сладости": "/category-images/sweet.svg",
    "прочее": "/category-images/misc.svg",
    "снеки и бакалея": "/category-images/snacks-grocery.svg",
    "мясо и колбаса": "/category-images/meat-sausage.svg",
};

function normalizeCategoryName(value?: string) {
    return (value ?? "")
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/\s*\/\s*/g, "/")
        .replace(/\s+/g, " ")
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
    const categoryName = props.name?.trim() || "Категория";
    const imageSrc = getCategoryImage(categoryName, props.imageUrl);
    const imageAlt = props.alt ?? categoryName;

    return (
        <Link
            to={props.linkId ?? "/"}
            className="category-card__link"
            aria-label={`Открыть категорию ${categoryName}`}
            title={categoryName}
        >
            <article className="category-card">
                <h3 className="category-card__title">
                    {categoryName}
                </h3>

                <div className="category-card__image-block">
                    <img
                        className="category-card__image"
                        src={imageSrc}
                        alt={imageAlt}
                        loading="lazy"
                        onError={(event) => {
                            if (!event.currentTarget.src.endsWith("other.svg")) {
                                event.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
                            }
                        }}
                    />
                </div>
            </article>
        </Link>
    );
}