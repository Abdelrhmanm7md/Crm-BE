const siteUrl = "https://a2mstore.com"; // Replace with your actual WordPress site URL
const consumerKey = "ck_517a418552f69626f680fd9e9680493773c98a15";
const consumerSecret = "cs_31e25e3dd80963f0d80cfa4bcd68d89d9439ee48";

const apiUrl = `${siteUrl}/wp-json/wc/v3/products`;
const headers = {
    "Authorization": "Basic " + btoa(`${consumerKey}:${consumerSecret}`),
    "Content-Type": "application/json"
};

// 🔹 **Fetch All Products**
const fetchProducts = async () => {
    try {
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const products = await response.json();
        console.log(products);
        return products;
    } catch (error) {
        console.error(error);
    }
};

// 🔹 **Fetch Single Product by ID**
const fetchProductById = async (id) => {
    try {
        const response = await fetch(`${apiUrl}/${id}`, { headers });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const product = await response.json();
        console.log(product);
        return product;
    } catch (error) {
        console.error(error);
    }
};

// 🔹 **Create a New Product**
const createProduct = async (productData) => {
    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const newProduct = await response.json();
        console.log("Product Created:", newProduct);
        return newProduct;
    } catch (error) {
        console.error(error);
    }
};

// 🔹 **Update a Product by ID**
const updateProduct = async (id, updatedData) => {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const updatedProduct = await response.json();
        console.log("Product Updated:", updatedProduct);
        return updatedProduct;
    } catch (error) {
        console.error(error);
    }
};

// 🔹 **Delete a Product by ID**
const deleteProduct = async (id) => {
    try {
        const response = await fetch(`${apiUrl}/${id}?force=true`, {
            method: "DELETE",
            headers
        });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const deletedProduct = await response.json();
        console.log("Product Deleted:", deletedProduct);
        return deletedProduct;
    } catch (error) {
        console.error(error);
    }
};

// 🛠 **Example Usage**
(async () => {
    // Fetch all products
    await fetchProducts();

    // Fetch a single product by ID
    await fetchProductById(123); // Replace 123 with a valid product ID

    // Create a new product
    await createProduct({
        name: "New Product",
        type: "simple",
        regular_price: "19.99",
        description: "This is a test product.",
        categories: [{ id: 9 }], // Replace with a valid category ID
        images: [{ src: "https://yourwebsite.com/image.jpg" }]
    });

    // Update a product
    await updateProduct(123, { regular_price: "24.99" }); // Replace 123 with a valid product ID

    // Delete a product
    await deleteProduct(123); // Replace 123 with a valid product ID
})();
