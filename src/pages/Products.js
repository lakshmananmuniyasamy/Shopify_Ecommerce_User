import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Form } from 'react-bootstrap';
import Navbar from '../Components/Navbar';
import { toast } from 'react-toastify';
import { socket, joinRoom, leaveRoom } from '../socket';
import IpAddress from '../Components/IP_Address';
import './Product.css';
import { useNavigate, useParams } from 'react-router-dom';

const Products = () => {
    const { category, subcategory } = useParams();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [noResultsMessage, setNoResultsMessage] = useState('');
    const token = localStorage.getItem('token');
    const navigate = useNavigate();


    useEffect(() => {
        fetchProducts();
        const initializeSocket = async () => {
            const ip = await IpAddress();
            if (token) {
                joinRoom(token);
            } else if (ip) {
                joinRoom(ip);
            }

            // socket.on('cartUpdated', (length) => {
            //     console.log("Cart updated event received in Products component");
            //     console.log('cartlength==============',length)
            //     setC(length);
                
            //     fetchProducts();
            // });
        };

        initializeSocket();

        return () => {
            const cleanupSocket = async () => {
                const ip = await IpAddress();
                if (token) {
                    leaveRoom(token);
                } else if (ip) {
                    leaveRoom(ip);
                }
            };

            cleanupSocket();
            socket.off('cartUpdated');
        };
    }, [token, category, subcategory]);

    useEffect(() => {
        fetchFilterData();
    }, [searchTerm])



    const fetchProducts = async () => {
        try {
            console.log("cato", category);
            console.log("subo", subcategory);
            let url;
            if (category && subcategory) {
                url = `http://localhost:8080/product/getproducts/${category}/${subcategory}`;
            } else if (category && category !== 'All') {
                url = `http://localhost:8080/product/getproducts/${category}`;
            } else {
                console.log("alllllll")
                url = 'http://localhost:8080/product/getallproducts';
            }

            const response = await axios.get(url);
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchFilterData = async () => {
        try {
            if (searchTerm.match(" ")) {
                fetchProducts();
                return;
            }

            const response = await axios.get(`http://localhost:8080/product/search/${encodeURIComponent(searchTerm || " ")}`);
            console.log('response in fetch status', response)
            try {
                if (response.status === 201) {
                    setProducts([]);
                    setNoResultsMessage('No products found matching the search criteria');
                } else {
                    setProducts(response.data);
                    setNoResultsMessage('');
                }
            } catch (error) {
                toast.error('Failed to fetch filtered products. Please try again later.');
            }

        } catch (error) {
            console.error('Error fetching filtered products:', error);
        }
    };



    const handleAddtoCart = async (product) => {

        try {
            console.log("add to cart");
            const ip = await IpAddress();

            if (token) {
                const response = await axios.post("http://localhost:8080/cart/addtocart", { product }, { headers: { Authorization: `Bearer ${token}` } });

                if (response) {
                    toast.success("Product added Successfully");
                    console.log('respon in prod add in pro page', response.data)
                    socket.emit('cartUpdated');
                    navigate('/cart')
                }

            } else if (ip !== '' && !token) {
                const response = await axios.post("http://localhost:8080/tempcart/addtocart", { ip, product });

                if (response) {
                    toast.success("Product added Successfully");
                    socket.emit('cartUpdated');
                    navigate('/cart')
                }
            }
        } catch (error) {
            console.log('error', error);
        }
    };

    const shortenDescription = (address) => {
        if (!address) return '';
        const start = address.slice(0, 10);
        const end = address.slice(-9);
        return `${start}......${end}`;
    };



    return (
        <div className='bo1'>
            <Navbar />


            <div className="p1">
                <Form.Control
                    type="text"
                    placeholder="Search for products"
                    aria-label="Search for products"
                    aria-describedby="basic-addon1"
                    className='w-25 ms-5'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="row r1">
                    {noResultsMessage ? (
                        <h1 className="text-center w-100">{noResultsMessage}</h1>
                    ) : (
                        products.map(product => (
                            <div key={product._id} className="col-md-3 col-sm-12 mb-2 mt-2 ms-2">
                                <div className="card">
                                    <img src={`http://localhost:8080/uploads/${product.imageUrl}`} className="card-img-top" height={"320px"} alt={product.productName} />
                                    <div className="card-body">
                                        <h5 className="card-title">{product.productName}</h5>
                                        <p className="card-text">Price: ${product.price}</p>
                                        <p className="card-text">Description: {shortenDescription(product.description)}</p>
                                        <Button variant="primary" onClick={() => handleAddtoCart(product)}>Add to Cart</Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default Products;
