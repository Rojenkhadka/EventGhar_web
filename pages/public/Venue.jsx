import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventGharLogo from '../../src/assets/images/EventGhar.png';
import venueImg1 from '../../src/assets/images/venue_img1.png';
import venueImg2 from '../../src/assets/images/venue_img2.png';
import venueImg3 from '../../src/assets/images/venue_img3.png';
import { getPublicEvents } from '../../src/api/events';
import '../../src/CSS/landing.css';
import '../../src/CSS/pages.css';

const Venue = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [venueType, setVenueType] = useState('');
  const [spacePreference, setSpacePreference] = useState('');
  const [rating, setRating] = useState('');
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Venue images cycling through available images
  const venueImages = [venueImg1, venueImg2, venueImg3];

  useEffect(() => {
    const fetchEvents = async () => {
      const events = await getPublicEvents();
      setFeaturedEvents(events.slice(0, 4)); // Get first 4 events
    };
    fetchEvents();
  }, []);

  // Auto-slide carousel for hero background
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % venueImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(slideInterval);
  }, []);

  const handleSearch = () => {
    console.log('Searching with filters:', { category, location, guestCount, venueType, spacePreference, rating });
  };

  // Generate venue data with locations matching the design
  const popularVenues = [
    { id: 1, name: 'LOREM IPSUM RESORT', location: 'ABU DHABI', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[0] },
    { id: 2, name: 'LOREM IPSUM RESORT', location: 'LONDON', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[1] },
    { id: 3, name: 'LOREM IPSUM RESORT', location: 'TOKYO', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[2] },
    { id: 4, name: 'LOREM IPSUM RESORT', location: 'THAILAND', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[0] },
    { id: 5, name: 'LOREM IPSUM RESORT', location: 'SINGAPORE', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[1] },
    { id: 6, name: 'LOREM IPSUM RESORT', location: 'BANGKOK', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[2] },
    { id: 7, name: 'LOREM IPSUM RESORT', location: 'ABU DHABI', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[0] },
    { id: 8, name: 'LOREM IPSUM RESORT', location: 'LONDON', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[1] },
    { id: 9, name: 'LOREM IPSUM RESORT', location: 'TOKYO', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[2] },
    { id: 10, name: 'LOREM IPSUM RESORT', location: 'THAILAND', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[0] },
    { id: 11, name: 'LOREM IPSUM RESORT', location: 'SINGAPORE', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[1] },
    { id: 12, name: 'LOREM IPSUM RESORT', location: 'BANGKOK', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[2] },
  ];

  const recommendedVenues = [
    { id: 1, name: 'LOREM IPSUM RESORT', location: 'ABU DHABI', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[0] },
    { id: 2, name: 'LOREM IPSUM RESORT', location: 'ABU DHABI', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[1] },
    { id: 3, name: 'LOREM IPSUM RESORT', location: 'ABU DHABI', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[2] },
    { id: 4, name: 'LOREM IPSUM RESORT', location: 'ABU DHABI', rating: 5, reviews: 22, capacity: 'Upto 500 Guests', image: venueImages[0] },
  ];

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // Animation keyframes
  const fadeInUp = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Hero Carousel Transitions */
    .hero-carousel-slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0;
      transition: opacity 1.5s ease-in-out, transform 1.5s ease-in-out;
      transform: scale(1.05);
    }

    .hero-carousel-slide.active {
      opacity: 1;
      transform: scale(1);
      z-index: 1;
    }

    .hero-carousel-slide.prev {
      opacity: 0;
      transform: scale(1);
      z-index: 0;
    }

    .venues-hero {
      position: relative;
      overflow: hidden;
    }

    .hero-carousel-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    .hero-carousel-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3));
      z-index: 2;
    }

    .hero-content {
      position: relative;
      z-index: 3;
    }
  `;

  return (
    <div className="landing-page">
      <style>{fadeInUp}</style>
      <header className="landing-header">
        <div className="landing-container">
          <div className="landing-navbar">
            <div className="landing-logo" onClick={() => navigate('/')}>
              <img src={eventGharLogo} alt="EventGhar" className="landing-logoImage" />
              <div className="landing-logoText">
                <span className="landing-logoName">EventGhar</span>
              </div>
            </div>
            <nav className="landing-nav">
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
              <a href="/venue" className="active" onClick={(e) => { e.preventDefault(); navigate('/venue'); }}>Venue</a>
              <button className="landing-navBtn" onClick={() => navigate('/login')}>LOGIN</button>
              <button className="landing-navBtn landing-navBtnPrimary" onClick={() => navigate('/register')}>SIGNUP</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Background Image Carousel */}
      <section className="venues-hero" style={{
        padding: '120px 0 100px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeIn 1s ease-in-out'
      }}>
        {/* Carousel Container with Multiple Slides */}
        <div className="hero-carousel-container">
          {venueImages.map((image, index) => (
            <div
              key={index}
              className={`hero-carousel-slide ${index === currentSlide ? 'active' : 'prev'}`}
              style={{
                backgroundImage: `url(${image})`
              }}
            />
          ))}
        </div>
        
        {/* Dark Overlay */}
        <div className="hero-carousel-overlay"></div>
        
        {/* Content on Top */}
        <div className="hero-content">
          <div className="landing-container" style={{ animation: 'fadeInUp 1s ease-in-out' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: '50px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)'
            }}>OUR VENUES</h1>
            
            {/* Primary Search Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              maxWidth: '900px',
              margin: '0 auto 32px'
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text"
                  placeholder="Search Category"
                  style={{
                    width: '100%',
                    padding: '16px 24px 16px 50px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                />
                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', opacity: 0.8 }}>🔍</span>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text"
                  placeholder="Search Location"
                  style={{
                    width: '100%',
                    padding: '16px 24px 16px 50px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                />
                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', opacity: 0.8 }}>📍</span>
              </div>
              <button 
                onClick={handleSearch}
                style={{
                  padding: '16px 56px',
                  background: 'rgba(26, 26, 26, 0.8)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(51, 51, 51, 0.9)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(26, 26, 26, 0.8)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                SEARCH
              </button>
            </div>

            {/* Carousel Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
              {venueImages.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: currentSlide === index ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: currentSlide === index ? 'scale(1.2)' : 'scale(1)'
                  }}
                  onClick={() => setCurrentSlide(index)}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filters */}
      <section style={{ background: '#ffffff', padding: '30px 0', borderBottom: '1px solid #e0e0e0', animation: 'fadeInUp 1s ease-in-out' }}>
        <div className="landing-container" style={{ animation: 'fadeIn 0.8s ease-in-out 0.2s both' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <select 
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              style={{
                padding: '12px 40px 12px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="">No. of Guests</option>
              <option value="0-50">0-50 Guests</option>
              <option value="50-100">50-100 Guests</option>
              <option value="100-200">100-200 Guests</option>
              <option value="200-500">200-500 Guests</option>
              <option value="500+">500+ Guests</option>
            </select>
            <select 
              value={venueType}
              onChange={(e) => setVenueType(e.target.value)}
              style={{
                padding: '12px 40px 12px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="">Venue Type</option>
              <option value="hotel">Hotel</option>
              <option value="resort">Resort</option>
              <option value="banquet">Banquet Hall</option>
              <option value="outdoor">Outdoor</option>
            </select>
            <select 
              value={spacePreference}
              onChange={(e) => setSpacePreference(e.target.value)}
              style={{
                padding: '12px 40px 12px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="">Space Preference</option>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="both">Both</option>
            </select>
            <select 
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              style={{
                padding: '12px 40px 12px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#ffffff',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="">Rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>
            <button 
              onClick={handleSearch}
              style={{
                padding: '12px 48px',
                background: '#d9d9d9',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#c0c0c0'}
              onMouseLeave={(e) => e.target.style.background = '#d9d9d9'}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="landing-section" style={{ animation: 'fadeInUp 1s ease-in-out' }}>
        <div className="landing-container" style={{ animation: 'fadeIn 0.8s ease-in-out 0.3s both' }}>
          <div className="landing-sectionHeader">
            <h2>Featured Events</h2>
            <a href="#" className="landing-viewAll">View All Events</a>
          </div>
          <div className="landing-grid4">
            {featuredEvents.length > 0 ? (
              featuredEvents.map((event) => (
                <div key={event._id} className="landing-card">
                  <div className="landing-cardImage">
                    {event.image ? (
                      <img src={event.image} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      '🎉'
                    )}
                  </div>
                  <div className="landing-cardContent">
                    <h3>{event.name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--landing-muted)', marginBottom: '6px' }}>
                      📅 {event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--landing-muted)', marginBottom: '16px' }}>
                      📍 {event.location || 'Location TBD'}
                    </p>
                    <button 
                      className="landing-exploreBtn" 
                      onClick={() => navigate(`/event/${event._id}`)}
                      style={{ width: '100%' }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Placeholder cards when no events
              Array(4).fill(null).map((_, idx) => (
                <div key={idx} className="landing-card">
                  <div className="landing-cardImage">🎉</div>
                  <div className="landing-cardContent">
                    <h3>Event Coming Soon</h3>
                    <p style={{ fontSize: '13px', color: 'var(--landing-muted)', marginBottom: '6px' }}>
                      📅 Date TBD
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--landing-muted)', marginBottom: '16px' }}>
                      📍 Location TBD
                    </p>
                    <button 
                      className="landing-exploreBtn" 
                      style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}
                      disabled
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popular Venues Section */}
      <section style={{ padding: '80px 0', background: '#ffffff', animation: 'fadeInUp 1s ease-in-out' }}>
        <div className="landing-container" style={{ animation: 'fadeIn 0.8s ease-in-out 0.4s both' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '50px'
          }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1a1a1a',
              margin: 0
            }}>Popular Venues</h2>
            <a href="#" style={{
              color: '#666666',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.3s ease'
            }}>View All</a>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '32px',
            marginBottom: '50px'
          }}>
            {popularVenues.map((venue) => (
              <div key={venue.id} style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '66.67%',
                  background: `url(${venue.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  overflow: 'hidden'
                }}>
                  <button style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    padding: '8px 24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}>Explore</button>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    margin: '0 0 10px 0',
                    lineHeight: '1.4'
                  }}>
                    {venue.name}, <span style={{ fontWeight: '700' }}>{venue.location}</span>
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      color: '#000000',
                      fontSize: '14px',
                      letterSpacing: '2px'
                    }}>{renderStars(venue.rating)}</span>
                    <span style={{
                      fontSize: '13px',
                      color: '#1a1a1a',
                      fontWeight: '600'
                    }}>{venue.rating} ({venue.reviews})</span>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: '#666666',
                    margin: 0
                  }}>{venue.capacity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px'
          }}>
            <button style={{
              width: '40px',
              height: '40px',
              border: '1px solid #e0e0e0',
              background: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.3s ease'
            }}>‹</button>
            <button style={{
              width: '40px',
              height: '40px',
              border: 'none',
              background: '#1a1a1a',
              color: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}>1</button>
            <button style={{
              width: '40px',
              height: '40px',
              border: '1px solid #e0e0e0',
              background: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}>2</button>
            <button style={{
              width: '40px',
              height: '40px',
              border: '1px solid #e0e0e0',
              background: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}>3</button>
            <button style={{
              width: '40px',
              height: '40px',
              border: '1px solid #e0e0e0',
              background: '#ffffff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.3s ease'
            }}>›</button>
          </div>
        </div>
      </section>

      {/* Promotional Banner Section */}
      <section style={{
        padding: '100px 0',
        background: '#2d2d2d',
        position: 'relative',
        animation: 'fadeIn 1s ease-in-out'
      }}>
        <div className="landing-container" style={{ animation: 'scaleIn 0.8s ease-in-out 0.3s both' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            alignItems: 'center'
          }}>
            <div style={{
              width: '100%',
              height: '400px',
              background: `url(${venueImg2})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}></div>
            <div>
              <h2 style={{
                fontSize: '42px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '24px',
                lineHeight: '1.2'
              }}>Perfect Venue, Memorable Events.</h2>
              <p style={{
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>Secure your event's stage, book the perfect venue today. Elevate your occasions with ease.</p>
              <button style={{
                padding: '16px 48px',
                background: '#ffffff',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 8px 24px rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}>BOOK AN EVENT</button>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendation Section */}
      <section style={{ padding: '80px 0', background: '#f9f9f9', animation: 'fadeInUp 1s ease-in-out' }}>
        <div className="landing-container" style={{ animation: 'fadeIn 0.8s ease-in-out 0.5s both' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '50px'
          }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#1a1a1a',
              margin: 0
            }}>Personalized Recommendation</h2>
            <a href="#" style={{
              color: '#666666',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.3s ease'
            }}>View All</a>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '32px'
          }}>
            {recommendedVenues.map((venue) => (
              <div key={venue.id} style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '66.67%',
                  background: `url(${venue.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  overflow: 'hidden'
                }}>
                  <button style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    padding: '8px 24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}>Explore</button>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    margin: '0 0 10px 0',
                    lineHeight: '1.4'
                  }}>
                    {venue.name}, <span style={{ fontWeight: '700' }}>{venue.location}</span>
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      color: '#000000',
                      fontSize: '14px',
                      letterSpacing: '2px'
                    }}>{renderStars(venue.rating)}</span>
                    <span style={{
                      fontSize: '13px',
                      color: '#1a1a1a',
                      fontWeight: '600'
                    }}>{venue.rating} ({venue.reviews})</span>
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: '#666666',
                    margin: 0
                  }}>{venue.capacity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footerContent">
            {/* Company Info */}
            <div className="landing-footerColumn">
              <div className="landing-footerLogo">
                <img src={eventGharLogo} alt="EventGhar" className="landing-footerLogoImage" />
                <span className="landing-footerLogoText">EventGhar</span>
              </div>
              <p className="landing-footerSubtitle">Social Medias</p>
              <div className="landing-socialLinks">
                <a href="#" className="landing-socialIcon" aria-label="Facebook">f</a>
                <a href="#" className="landing-socialIcon" aria-label="Twitter">𝕏</a>
                <a href="#" className="landing-socialIcon" aria-label="Instagram">📷</a>
                <a href="#" className="landing-socialIcon" aria-label="LinkedIn">in</a>
              </div>
            </div>

            {/* Venues Links */}
            <div className="landing-footerColumn">
              <h4 className="landing-footerTitle">Venues</h4>
              <ul className="landing-footerLinks">
                <li><a href="#abudhabi">Abu Dhabi</a></li>
                <li><a href="#alain">Al Ain</a></li>
                <li><a href="#news">News</a></li>
                <li><a href="#fashion">Fashion</a></li>
                <li><a href="#facilities">Buy All channels</a></li>
              </ul>
            </div>

            {/* Suppliers Links */}
            <div className="landing-footerColumn">
              <h4 className="landing-footerTitle">Suppliers</h4>
              <ul className="landing-footerLinks">
                <li><a href="#photographers">Photographers</a></li>
                <li><a href="#videographers">Videographers</a></li>
                <li><a href="#celebrants">Celebrants</a></li>
                <li><a href="#choreographers">Choreographers</a></li>
                <li><a href="#designers">Designers</a></li>
                <li><a href="#weddingartists">Wedding Artists</a></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="landing-footerColumn">
              <h4 className="landing-footerTitle">Quick Links</h4>
              <ul className="landing-footerLinks">
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#suppliers">Suppliers</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms & Conditions</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="landing-footerColumn">
              <h4 className="landing-footerTitle">Newsletter</h4>
              <p className="landing-footerText">
                Subscribe to Get Latest Vendors Updates
              </p>
              <div className="landing-newsletter">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="landing-newsletterInput"
                />
                <button className="landing-newsletterBtn">Subscribe</button>
              </div>
              <a href="#chat" className="landing-liveChat">Live Chat</a>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="landing-footerBottom">
            <p>Made with ❤️ by <a href="#developer">EventGhar.design</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Venue;
