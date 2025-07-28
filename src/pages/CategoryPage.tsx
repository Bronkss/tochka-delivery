import { useParams } from 'react-router-dom';
import HotDogs from './categories/HotDogs';


export default function CategoryPages() {
    const { categoryId } = useParams<{ categoryId: string }>();

    switch (categoryId) {
        case 'hot-dogs':
            return <HotDogs />;
        default:
    //         Переход на 404
    }
}