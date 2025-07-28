import { useParams } from 'react-router-dom';
import HotDogs from './categories/HotDogs';
import Burgers from './categories/Burgers';
import {NotFoundPage} from "./NotFoundPage.tsx";


export default function CategoryPages() {
    const { categoryId } = useParams<{ categoryId: string }>();

    switch (categoryId) {
        case 'hot-dogs':
            return <HotDogs />;
        case 'burgers':
            return <Burgers />
        default:
            return <NotFoundPage />;
    }
}