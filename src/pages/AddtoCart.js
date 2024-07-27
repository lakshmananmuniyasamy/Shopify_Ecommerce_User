import React, { useEffect, useState } from 'react';
import Navbar from '../Components/Navbar';
import axios from 'axios';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import UseWeb3 from '../UseWeb3/UseWeb';
import { GoPlusCircle } from "react-icons/go";
import { RiIndeterminateCircleLine } from "react-icons/ri";
import UseFetchIp from '../Components/IP_Address';

const AddtoCart = () => {
    const { account, contract } = UseWeb3();
    const [cartLength,setCartLength]= useState(0);
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState({});
    const token = localStorage.getItem('token');
    const [show, setShow] = useState(false);
    const [ip, setIp] = useState('');

    useEffect(() => {
        fetchIp();
        fetchData();
    }, [ip, token]);

    const fetchIp = async () => {
        const fetchedIp = await UseFetchIp();
        setIp(fetchedIp);
    };

    const fetchData = async () => {
        console.log("token",token);
        try {
            if (ip !== '' && !token) {
                const response = await axios.post("http://localhost:8080/tempcart/getcart", { ip });
                setCarts(response.data);

            } else if (token) {
                const response = await axios.get("http://localhost:8080/cart/getcartstatus", { headers: { Authorization: `Bearer ${token}` } });
                setCarts(response.data);
                console.log('length',response.data.length);
                setCartLength(response.data.length);
                console.log("data in token carts", response.data);
            }
        } catch (error) {
            toast.error('Error fetching cart data');
        }
    }

    const handleRemove = async (cartItemId, productId) => {

        try {
            console.log("product id=============", productId)
            if (ip && !token) {
                await axios.delete(`http://localhost:8080/tempcart/remove/${cartItemId}`, { data: { ip } });
                setCarts(carts.filter(cart => cart._id !== cartItemId));
                toast.success('Item removed from cart');
            } else if (token) {
                // await axios.put(`http://localhost:8080/product/update/${productId}`, { active: false }, { headers: { Authorization: `Bearer ${token}` } });
               const response =  await axios.delete(`http://localhost:8080/cart/remove/${cartItemId}`, { headers: { Authorization: `Bearer ${token}` } });
                setCarts(carts.filter(cart => cart._id !== cartItemId));
                setCartLength(response.data.length);
                toast.success('Item removed from cart');
            }
        } catch (err) {
            toast.error('Error removing item from cart');
        }
    };

    async function convert(n) {
        try {
            var sign = +n < 0 ? "-" : "",
                toStr = n.toString();
            if (!/e/i.test(toStr)) {
                return n;
            }
            var [lead, decimal, pow] = n
                .toString()
                .replace(/^-/, "")
                .replace(/^([0-9]+)(e.*)/, "$1.$2")
                .split(/e|\./);
            return +pow < 0
                ? sign +
                "0." +
                "0".repeat(Math.max(Math.abs(pow) - 1 || 0, 0)) +
                lead +
                decimal
                : sign +
                lead +
                (+pow >= decimal.length
                    ? decimal + "0".repeat(Math.max(+pow - decimal.length || 0, 0))
                    : decimal.slice(0, +pow) + "." + decimal.slice(+pow));
        } catch (err) {
            return 0;
        }
    }

    const handleBuy = async (id, totalPrice,quantity) => {
        if (!token) {
            return setShow(true);
        }
        try {
            console.log('token',token)
            setLoading(prev => ({ ...prev, [id]: true }));
            console.log('window.ethereum',window.ethereum);
            if (!window.ethereum) {
                toast.error('MetaMask not detected. Please install MetaMask extension.');
                setLoading(prev => ({ ...prev, [id]: false }));
                return;
            }
           
            const price = totalPrice * 1e18
            const amount =await convert(price);
            console.log("price ",amount)

            const to = "0xf9Ec05cEA1A2A10578C895C3059629F16B8ED0a9";

            await contract.methods.transfer(to, amount ).send({ from: account }).then((res) => {
                if (res) {
                    toast.success('Transaction sent successfully!');
                    const response =  axios.put(`http://localhost:8080/cart/updatestatus/${id}`,{status:'sold',quantity:quantity})
                    console.log("response in buy in sold",response.data);
                    fetchData();
                } else {
                    toast.error('Transaction failed');
                }
            });

        } catch (error) {
            toast.error('Payment failed');
        }

        setLoading(prev => ({ ...prev, [id]: false }));
    };

    const handleQuantityChange = async (id, newQuantity) => {
        try {
            if (ip && !token) {
                const response = await axios.put(`http://localhost:8080/tempcart/update/${ip}`, { quantity: newQuantity, ip });
                // setCarts(carts.map(cart => cart._id === id ? { ...cart, quantity: response.data.quantity } : cart));
                setCarts(carts.map((cart) => {
                    if (cart._id === id) {
                        return response.data
                    }
                    else {
                        return cart
                    }
                }));

            } else if (token) {
                const response = await axios.put(`http://localhost:8080/cart/update/${id}`, { quantity: newQuantity }, { headers: { Authorization: `Bearer ${token}` } });

                //  setCarts(carts.map(cart => cart._id === id ? { ...cart, quantity: response.data } : cart));

                setCarts(carts.map((cart) => {
                    if (cart._id === id) {
                        return response.data
                    }
                    else {
                        return cart
                    }
                }));
                // setCarts(carts.map(cart => cart._id === id ? { ...cart, quantity: response.data.quantity } : cart));
            }
        } catch (err) {
            toast.error('Error updating quantity');
        }
    };

    const increaseQuantity = (id, quantity) => {
        handleQuantityChange(id, quantity + 1);
    };

    const decreaseQuantity = (id, quantity) => {
        if (quantity > 1) {
            handleQuantityChange(id, quantity - 1);
        }
    };

  
    return (
        <>
            <Navbar count={cartLength} />
            <div className="container" style={{ marginTop: '70px' }}>
                {carts.length !== 0 ? <h2 className="text-center">Your Cart</h2> : <h2 className="text-center">Your Cart is Empty</h2>}

                <div className="row">
                    { carts.map(cart => (
                        <div key={cart._id} className="col-lg-3 col-md-6 mb-4">
                            <div className="card h-100">
                                <img src={`http://localhost:8080/uploads/${cart.imageUrl}`} className="card-img-top" alt={cart.productName} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                <div className="card-body">
                                    <h5 className="card-title">{cart.productName}</h5>
                                    <p className="card-text">Price: ${(cart.price).toFixed(2)}</p>
                                    <p className="card-text">Total Price: ${(cart.totalPrice)}</p>
                                    <p className="card-text">Description: {cart.description}</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <GoPlusCircle onClick={() => increaseQuantity(cart._id, cart.quantity)} style={{ cursor: 'pointer' }} />
                                        <input
                                            type="number"
                                            min="1"
                                            value={cart.quantity}
                                            onChange={(e) => handleQuantityChange(cart._id, parseInt(e.target.value))}
                                            style={{ width: '60px' }}
                                        />
                                        <RiIndeterminateCircleLine onClick={() => decreaseQuantity(cart._id, cart.quantity)} style={{ cursor: 'pointer' }} />
                                    </div>
                                    <div className="d-flex justify-content-between mt-3">
                                        <Button variant="danger" onClick={() => handleRemove(cart._id, cart.productId)}>Remove</Button>
                                        <Button variant="success" onClick={() => handleBuy(cart._id, cart.totalPrice,cart.quantity)} disabled={loading[cart._id]}>
                                            {loading[cart._id] ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Buy'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title></Modal.Title>
                </Modal.Header>
                <Modal.Body>Please Login</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>
                        Close
                    </Button>
                    <Button variant="primary" href='/login'>
                        Login
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default AddtoCart;



















// import React, { useEffect, useState } from 'react';
// import Navbar from '../Components/Navbar';
// import axios from 'axios';
// import { Button, Modal, Spinner } from 'react-bootstrap';
// import { toast } from 'react-toastify';
// import UseWeb3 from '../UseWeb3/UseWeb';
// import { GoPlusCircle } from "react-icons/go";
// import { RiIndeterminateCircleLine } from "react-icons/ri";
// import UseFetchIp from '../Components/IP_Address';

// const AddtoCart = () => {
//     const { account, contract } = UseWeb3();
//     const [carts, setCarts] = useState([]);
//     const [loading, setLoading] = useState({});
//     const token = localStorage.getItem('token');
//     const [show, setShow] = useState(false);
//     const [ip, setIp] = useState('');

//     useEffect(() => {
//         fetchIp();
//         fetchData();
//     }, [ip, token]);

//     const fetchIp = async () => {
//         const fetchedIp = await UseFetchIp();
//         setIp(fetchedIp);
//     };

//     const fetchData = async () => {
//         try {
//             if (ip !== '' && !token) {
//                 const response = await axios.post("http://localhost:8080/tempcart/getcart", { ip });
//                 setCarts(response.data);
//             }
//             else if (token) {
//                 const response = await axios.get("http://localhost:8080/cart/getcart", { headers: { Authorization: `Bearer ${token}` } });
//                 setCarts(response.data);
//                 console.log("data in token carts", response.data)
//             }
//         } catch (error) {
//             toast.error('Error fetching cart data');
//         }
//     }


//     const handleRemove = async (id) => {
//         try {
//             if (ip && !token) {
//                 // Remove item from temp cart
//                 await axios.delete(`http://localhost:8080/tempcart/remove/${id}`, { data: { ip } });
//                 setCarts(carts.filter(cart => cart._id !== id));
//                 toast.success('Item removed from cart');
//             } else if (token) {
//                 await axios.put(`http://localhost:8080/product/update/${id}`, { active: false }, { headers: { Authorization: `Bearer ${token}` } });

//                 // Remove item from cart
//                 await axios.delete(`http://localhost:8080/cart/remove/${id}`, { headers: { Authorization: `Bearer ${token}` } });

//                 // Update product active status to false

//                 setCarts(carts.filter(cart => cart._id !== id));
//                 toast.success('Item removed from cart');
//             }
//         } catch (err) {
//             toast.error('Error removing item from cart');
//         }
//     };


//     const handleBuy = async (id, price) => {
//         if (!token) {
//             return setShow(true);
//         }
//         try {
//             setLoading(prev => ({ ...prev, [id]: true }));

//             if (!window.ethereum) {
//                 toast.error('MetaMask not detected. Please install MetaMask extension.');
//                 setLoading(prev => ({ ...prev, [id]: false }));
//                 return;
//             }

//             const amount = price;
//             const to = "0xf9Ec05cEA1A2A10578C895C3059629F16B8ED0a9";

//             await contract.methods.transfer(to, amount * 1e18).send({ from: account }).then((res) => {
//                 if (res) {
//                     toast.success('Transaction sent successfully!');
//                 } else {
//                     toast.error('Transaction failed');
//                 }
//             });

//         } catch (error) {
//             toast.error('Error requesting MetaMask account access.');
//         }

//         setLoading(prev => ({ ...prev, [id]: false }));
//     };

//     const handleQuantityChange = async (id, newQuantity) => {
//         try {
//             if (ip && !token) {
//                 const response = await axios.put(`http://localhost:8080/tempcart/update/${id}`, { quantity: newQuantity, ip });
//                 setCarts(carts.map(cart => cart._id === id ? { ...cart, quantity: response.data.quantity } : cart));
//             } else if (token) {
//                 const response = await axios.put(`http://localhost:8080/cart/update/${id}`, { quantity: newQuantity }, { headers: { Authorization: `Bearer ${token}` } });
//                 setCarts(carts.map(cart => cart._id === id ? { ...cart, quantity: response.data.quantity } : cart));
//             }
//         } catch (err) {
//             toast.error('Error updating quantity');
//         }
//     };

//     const increaseQuantity = (id, quantity) => {
//         handleQuantityChange(id, quantity + 1);
//     };

//     const decreaseQuantity = (id, quantity) => {
//         if (quantity > 1) {
//             handleQuantityChange(id, quantity - 1);
//         }
//     };

//     useEffect(() => {
//         const handleBeforeUnload = (event) => {
//             if (!token && ip) {
//                 axios.post("http://localhost:8080/tempcart/remove", { ip })
//                     .then(response => {
//                         console.log("Data removed from DB:", response.data);
//                     })
//                     .catch(err => {
//                         console.error("Error removing data:", err);
//                     });
//             }
//         };

//         window.addEventListener("beforeunload", handleBeforeUnload);

//         return () => {
//             window.removeEventListener("beforeunload", handleBeforeUnload);
//         };
//     }, [ip, token]);

//     return (
//         <>
//             <Navbar />
//             <div className="container" style={{ marginTop: '70px' }}>
//                 {carts.length !== 0 ? <h2 className="text-center">Your Cart</h2> : <h2 className="text-center">Your Cart is Empty</h2>}

//                 <div className="row">
//                     {carts.map(cart => (
//                         <div key={cart._id} className="col-lg-3 col-md-6 mb-4">
//                             <div className="card h-100">
//                                 <img src={`http://localhost:8080/uploads/${cart.imageUrl}`} className="card-img-top" alt={cart.productName} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
//                                 <div className="card-body">
//                                     <h5 className="card-title">{cart.productName}</h5>
//                                     <p className="card-text">Price: ${(cart.price * cart.quantity).toFixed(2)}</p>
//                                     <p className="card-text">Description: {cart.description}</p>
//                                     <div className="d-flex justify-content-between align-items-center">
//                                         <GoPlusCircle onClick={() => increaseQuantity(cart._id, cart.quantity)} style={{ cursor: 'pointer' }} />
//                                         <input
//                                             type="number"
//                                             min="1"
//                                             value={cart.quantity}
//                                             onChange={(e) => handleQuantityChange(cart._id, parseInt(e.target.value))}
//                                             style={{ width: '60px' }}
//                                         />
//                                         <RiIndeterminateCircleLine onClick={() => decreaseQuantity(cart._id, cart.quantity)} style={{ cursor: 'pointer' }} />
//                                     </div>
//                                     <div className="d-flex justify-content-between mt-3">
//                                         <Button variant="danger" onClick={() => handleRemove(cart._id)}>Remove</Button>
//                                         <Button variant="success" onClick={() => handleBuy(cart._id, cart.price)} disabled={loading[cart._id]}>
//                                             {loading[cart._id] ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Buy'}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             <Modal show={show} onHide={() => setShow(false)}>
//                 <Modal.Header closeButton>
//                     <Modal.Title></Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>Please Login</Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShow(false)}>
//                         Close
//                     </Button>
//                     <Button variant="primary" href='/login'>
//                         Login
//                     </Button>
//                 </Modal.Footer>
//             </Modal>
//         </>
//     );
// };

// export default AddtoCart;
