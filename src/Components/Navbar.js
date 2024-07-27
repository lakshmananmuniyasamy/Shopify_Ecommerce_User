import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Form, Nav, NavDropdown, NavLink, Navbar } from 'react-bootstrap';
import Badge from 'react-bootstrap/Badge';
import { FaShoppingCart, FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import { socket } from '../socket';
import ProfileUpdateCanvas from '../pages/ProfileUpdateOffcanvas';

function BasicExample({count}) {
    const token = localStorage.getItem('token');

    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [subCategories, setSubCategories] = useState([]);
    const [cartLength,setCartLength]= useState(0);
    const [length,setLength] = useState(0);
    const navigate = useNavigate();
    let ip = '';

    useEffect(() => {
        fetchSubCategories();

        socket.on('cartUpdated', (data) => {
            console.log("updatedddd=======================")
            console.log("Cart updated event received",data.length);
            setLength(data.length);
        });
        socket.emit('demo',{name:"lax"})
        // socket.on('demo1',)

        return () => {
            socket.off('cartUpdated');
            socket.off('demo');
            // socket.disconnect()
        };
    }, [ip, token]);

    useEffect(()=>{
        fetchLength();
    },[count,cartLength])

    const fetchLength =async()=>{
        const response = await axios.get("http://localhost:8080/cart/getcartstatus", { headers: { Authorization: `Bearer ${token}` } });
   
        console.log('response',response.data.length);
        setCartLength(response.data.length);
       
    }

    const fetchSubCategories = async () => {
        const response = await axios.get('http://localhost:8080/subcategory');
        setSubCategories(response.data);
    }

    const handleShow = () => setShowOffcanvas(true);

    const handleClose = () => setShowOffcanvas(false);

    const [activeDropdown, setActiveDropdown] = useState(null);

    const handleDropdownClick = (category) => {
        navigate(`/${category}`);
    };

    const handleSelect = (eventKey) => {
        navigate(`/${eventKey}`);
    };

    // Organize subCategories by category
    const categoriesMap = subCategories.reduce((acc, subcat) => {
       
        const category = subcat.categoryId.Category;

        if (!acc[category]) {
            acc[category] = [];
        }

        acc[category].push(subcat);
        return acc;
    }, {});



    return (
        <>

            <Navbar expand="lg" className="bg-body-tertiary p-2" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000 }}>
                <>
                    <Link to='/' className='text-decoration-none fs-2 me-4'><img src="/Asserts/logo.png" alt="Logo" /></Link>
                    <NavLink href='/'>Home</NavLink>&nbsp;&nbsp;&nbsp;
                    <NavLink href='/'>All</NavLink>&nbsp;&nbsp;&nbsp;&nbsp;
                    <div className='d-flex justify-content-spaceevenly'>

                        {Object.entries(categoriesMap).map(([category, subcats]) => (
                            <NavDropdown
                                key={category}
                                title={<span onClick={() => handleDropdownClick(category)}>{category}</span>}
                                id={`collasible-nav-dropdown-${category}`}
                                show={activeDropdown === category}
                                onMouseEnter={() => setActiveDropdown(category)}
                                onMouseLeave={() => setActiveDropdown(null)}
                                onSelect={handleSelect}
                            >
                                {subcats.map((subcat) => (
                                    <NavDropdown.Item
                                        key={subcat._id}
                                        eventKey={`${category}/${subcat.subCategory}`}
                                    >
                                        {subcat.subCategory}
                                    </NavDropdown.Item>
                                ))}
                            </NavDropdown>
                        ))}

                    </div>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto d-flex align-items-center">
                            <NavLink href='/cart' className='fs-4'><FaShoppingCart /><Badge bg="secondary">{length}</Badge></NavLink>

                            {token ? (
                                <>
                                    <NavLink onClick={handleShow}>
                                        <FaUserCircle size={30} />
                                    </NavLink>
                                </>
                            ) : (
                                <Nav.Link href="/login">
                                    <Button>Login</Button>
                                </Nav.Link>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </>
            </Navbar>
            <ProfileUpdateCanvas show={showOffcanvas} handleClose={handleClose} />
        </>
    );
}

export default BasicExample;




