import React from "react";
import AddToCart from "./AddToCard";
import styles from './ProductCard.module.css'

const ProductCard = () => {
    return (
        <div className={styles.card}> Product Card 
            <AddToCart />
        </div>
    )
}
export default ProductCard