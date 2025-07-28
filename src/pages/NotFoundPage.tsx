import { useNavigate } from 'react-router-dom';


export const NotFoundPage = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="not-found-container">
            <div className="stars"></div>

            <div className="astronaut">
                <div className="head"></div>
                <div className="arm left-arm"></div>
                <div className="arm right-arm"></div>
                <div className="body">
                    <div className="panel"></div>
                </div>
                <div className="leg left-leg"></div>
                <div className="leg right-leg"></div>
                <div className="backpack"></div>
            </div>

            <div className="not-found-content">
                <h1>404</h1>
                <h2>Потерялись в космосе</h2>
                <p>
                    Страница, которую вы ищете, была перемещена,<br />
                    удалена или никогда не существовала.
                </p>

                <button onClick={handleGoBack} className="back-button">
                    Вернуться на Землю
                </button>
            </div>
        </div>
    );
};