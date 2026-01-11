import styles from './ProductCard.module.css';

interface ProductCardProps {
    name: string;
    explanation: string;
    price_cn: string | number;
    price_kr: string | number;
}

export default function ProductCard({ name, explanation, price_cn, price_kr }: ProductCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{name}</h3>
            </div>
            <div className={styles.body}>
                <p className={styles.explanation}>{explanation}</p>
                <div className={styles.priceContainer}>
                    <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>🇨🇳 国内院长</span>
                        <span className={styles.priceValue}>¥{price_cn}</span>
                    </div>
                    {price_kr && price_kr !== 'N/A' && price_kr !== '0' && (
                        <>
                            <div className={styles.divider}></div>
                            <div className={styles.priceItem}>
                                <span className={styles.priceLabel}>🇰🇷 韩国院长</span>
                                <span className={styles.priceValue}>¥{price_kr}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
