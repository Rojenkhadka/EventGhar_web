import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventGharLogo from '../../src/assets/images/EventGhar.png';
import homeImg1 from '../../src/assets/images/home_img1.png';
import homeImg2 from '../../src/assets/images/home_img2.png';
import homeImg3 from '../../src/assets/images/home_img3.png';
import '../../src/styles/landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleCategories, setVisibleCategories] = useState(3);

  const categoriesPerPage = 8; // 2 rows × 4 columns

  // Home images for carousel
  const homeImages = [homeImg1, homeImg2, homeImg3];

  // Auto-slide carousel for hero background
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % homeImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(slideInterval);
  }, []);

  const handleSearch = () => {
    navigate('/dashboard');
  };

  // Expanded categories array for pagination
  const allCategories = [
    { title: 'DESTINATION WEDDINGS', image: '🖼️' },
    { title: 'HONEYMOON & TRAVEL WEDDING', image: '🖼️' },
    { title: 'VIDEOGRAPHERS WEDDING', image: '🖼️' },
    { title: 'CELEBRANT', image: '🖼️' },
    { title: 'PHOTOGRAPHERS', image: '🖼️' },
    { title: 'CATERING SERVICES', image: '🖼️' },
    { title: 'VENUE DECORATION', image: '🖼️' },
    { title: 'EVENT PLANNING', image: '🖼️' },
    { title: 'MAKEUP ARTISTS', image: '🖼️' },
    { title: 'DJ & MUSIC', image: '🖼️' },
    { title: 'FLORISTS', image: '🖼️' },
    { title: 'WEDDING CAKES', image: '🖼️' },
    { title: 'BRIDAL WEAR', image: '🖼️' },
    { title: 'TRANSPORTATION', image: '🖼️' },
    { title: 'INVITATION CARDS', image: '🖼️' },
    { title: 'CHOREOGRAPHERS', image: '🖼️' },
  ];

  const handleSeeMoreCategories = () => {
    setVisibleCategories(prev => Math.min(prev + 3, allCategories.length));
  };

  const handleSeeLessCategories = () => {
    setVisibleCategories(3);
  };

  const venues = [
    { title: 'LOREM IPSUM RESORT', location: 'MALDIVES', image: '🖼️' },
    { title: 'LOREM IPSUM RESORT', location: 'INDIA', image: '🖼️' },
    { title: 'LOREM IPSUM RESORT', location: 'ABU DHABI', image: '🖼️' },
    { title: 'LOREM IPSUM RESORT', location: 'DUBAI', image: '🖼️' },
  ];
  
  const mediaItems = [
    { title: 'LOREM IPSUM', description: 'Lorem ipsum dolor sit amet, consectetur' },
    { title: 'LOREM IPSUM', description: 'Lorem ipsum dolor sit amet, consectetur' },
    { title: 'LOREM IPSUM', description: 'Lorem ipsum dolor sit amet, consectetur' },
    { title: 'LOREM IPSUM', description: 'Lorem ipsum dolor sit amet, consectetur' },
  ];

  // Animation keyframes
  const animations = `
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

    .landing-hero {
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
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4));
      z-index: 2;
    }

    .hero-content {
      position: relative;
      z-index: 3;
    }

    .landing-heroTitle {
      text-shadow: 2px 2px 12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.5);
    }

    .hero-content p {
      text-shadow: 1px 1px 8px rgba(0, 0, 0, 0.8);
    }

    .animate-hero {
      animation: fadeIn 1s ease-in-out;
    }

    .animate-section {
      animation: fadeInUp 1s ease-in-out;
    }

    .animate-featured {
      animation: scaleIn 0.8s ease-in-out;
    }

    .animate-reviews {
      animation: fadeIn 1.2s ease-in-out;
    }
  `;

  return (
    <div className="landing-page">
      <style>{animations}</style>
      
      {/* Main Navigation */}
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
              <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="active">Home</a>
              <a href="/events" onClick={(e) => { e.preventDefault(); navigate('/events'); }}>Events</a>
              <button className="landing-navBtn" onClick={() => navigate('/login')}>LOGIN</button>
              <button className="landing-navBtn landing-navBtnPrimary" onClick={() => navigate('/register')}>SIGNUP</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero animate-hero" style={{ 
        position: 'relative', 
        overflow: 'hidden',
        background: 'transparent'
      }}>
        <div className="hero-carousel-container">
          {homeImages.map((image, index) => (
            <div
              key={index}
              className={`hero-carousel-slide ${index === currentSlide ? 'active' : ''} ${index === (currentSlide - 1 + homeImages.length) % homeImages.length ? 'prev' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            ></div>
          ))}
        </div>
        <div className="hero-carousel-overlay"></div>
        <div className="hero-content">
          <div className="landing-container">
            <h1 className="landing-heroTitle" style={{ 
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              textShadow: '2px 2px 12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 0, 0, 0.5)'
            }}>
              Discover and Manage Events Easily
            </h1>
            <p style={{ 
              fontSize: '18px', 
              color: '#ffffff', 
              marginBottom: '32px', 
              maxWidth: '700px', 
              margin: '0 auto 32px', 
              lineHeight: '1.6',
              textShadow: '1px 1px 8px rgba(0, 0, 0, 0.8)'
            }}>
              EventGhar helps users find events and allows organizers to manage events in one platform.
            </p>
            <div className="landing-searchBox">
              <button 
                className="landing-searchBtn" 
                onClick={() => navigate('/events')}
                style={{
                  background: 'rgba(26, 26, 26, 0.8)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  padding: '16px 56px',
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
                View Events
              </button>
              <button 
                className="landing-ctaBtn" 
                onClick={() => navigate('/register')}
                style={{
                  background: 'rgba(26, 26, 26, 0.8)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  padding: '16px 56px',
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
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Browse By Category */}
      <section className="landing-section animate-section">
        <div className="landing-container">
          <div className="landing-sectionHeader">
            <h2>Browse By Category</h2>
            <a href="#" className="landing-viewAll">View All ({allCategories.length})</a>
          </div>
          <div className="landing-grid4">
            {allCategories.slice(0, visibleCategories).map((cat, idx) => (
              <div key={idx} className="landing-card">
                <div className="landing-cardImage">{cat.image}</div>
                <div className="landing-cardContent">
                  <h3>{cat.title}</h3>
                </div>
              </div>
            ))}
          </div>
          {visibleCategories < allCategories.length ? (
            <button className="landing-seeMoreBtn" onClick={handleSeeMoreCategories}>See More</button>
          ) : (
            <button className="landing-seeLessBtn" onClick={handleSeeLessCategories}>See Less</button>
          )}
        </div>
      </section>

      {/* Popular Venue */}
      <section className="landing-section animate-section">
        <div className="landing-container">
          <div className="landing-sectionHeader">
            <h2>Popular Venue</h2>
            <a href="#" className="landing-viewAll">View All (1690)</a>
          </div>
          <div className="landing-grid4">
            {venues.map((venue, idx) => (
              <div key={idx} className="landing-card">
                <div className="landing-cardImage">{venue.image}</div>
                <div className="landing-cardContent">
                  <div className="landing-cardFooter">
                    <div>
                      <h3>{venue.title}</h3>
                      <p>{venue.location}</p>
                    </div>
                    <button className="landing-exploreBtn">Explore</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="landing-pagination">
            <button className="landing-pageBtn">‹</button>
            <button className="landing-pageBtn active">1</button>
            <button className="landing-pageBtn">2</button>
            <button className="landing-pageBtn">3</button>
            <button className="landing-pageBtn">›</button>
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="landing-featured animate-featured">
        <div className="landing-container">
          <div className="landing-featuredContent">
            <div className="landing-featuredImage">🖼️</div>
            <div className="landing-featuredText">
              <h2>Lorem ipsum dolor sit amet</h2>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
              <button className="landing-ctaBtn">CTA</button>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="landing-reviews animate-reviews">
        <div className="landing-container">
          <h2>Reviews</h2>
          <div className="landing-reviewCarousel">
            <button className="landing-carouselBtn">‹</button>
            <div className="landing-reviewCard">
              <div className="landing-reviewAvatar">👤</div>
              <h3>LOREM IPSUM</h3>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, quis nostrud exercitation ullamco laboris nisi</p>
            </div>
            <button className="landing-carouselBtn">›</button>
          </div>
          <div className="landing-carouselDots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </section>

      {/* Latest Media */}
      <section className="landing-section animate-section">
        <div className="landing-container">
          <div className="landing-sectionHeader">
            <h2>Latest Media</h2>
            <a href="#" className="landing-viewAll">View All (100)</a>
          </div>
          <div className="landing-grid4">
            {mediaItems.map((item, idx) => (
              <div key={idx} className="landing-mediaCard">
                <div className="landing-mediaImage">🖼️</div>
                <div className="landing-mediaContent">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <button className="landing-readMore">Read More</button>
                </div>
              </div>
            ))}
          </div>
          <div className="landing-pagination">
            <button className="landing-pageBtn">‹</button>
            <button className="landing-pageBtn active">1</button>
            <button className="landing-pageBtn">2</button>
            <button className="landing-pageBtn">...</button>
            <button className="landing-pageBtn">8</button>
            <button className="landing-pageBtn">›</button>
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
                <li><a href="#about">About</a></li>
                <li><a href="#faq">At An</a></li>
                <li><a href="#news">News</a></li>
                <li><a href="#future">Future</a></li>
                <li><a href="#facilities">Facilities</a></li>
                <li><a href="#destination">Destination</a></li>
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
                <li><a href="#florists">Florists</a></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="landing-footerColumn">
              <h4 className="landing-footerTitle">Quick Links</h4>
              <ul className="landing-footerLinks">
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#terms">Terms of Use</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#suppliers">Suppliers</a></li>
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
            <p>Made with ❤️ by <a href="#developer">EventGhar Team</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
