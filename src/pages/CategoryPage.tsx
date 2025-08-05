import { useParams } from 'react-router-dom';
import Pizzas from './categories/gotovaya-eda/Pizzas.tsx';
import Burgers from './categories/gotovaya-eda/Burgers.tsx';
import CannedFood from "./categories/bailey/СannedFood.tsx";
import {NotFoundPage} from "./NotFoundPage.tsx";


export default function CategoryPages() {
    const { categoryId } = useParams<{ categoryId: string }>();

    switch (categoryId) {
        case 'pizzas':
            return <Pizzas />;
        case 'burgers':
            return <Burgers />;
        case 'canned-food':
            return <CannedFood/>
        default:
            return <NotFoundPage />;
    }
}