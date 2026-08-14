import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center py-20">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <span className="text-8xl block mb-4 float-animation">🍫</span>
      <h1 className="font-display text-6xl font-bold text-choco-900 mb-4">404</h1>
      <h2 className="font-display text-2xl font-semibold text-choco-700 mb-4">
        Oops! This page melted away
      </h2>
      <p className="text-choco-500 mb-8 max-w-sm mx-auto">
        The page you're looking for doesn't exist or has been moved. Let's get you back to the good stuff.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/" id="not-found-home-btn" className="btn-primary px-8 py-3">
          Go Home
        </Link>
        <Link to="/products" id="not-found-shop-btn" className="btn-secondary px-8 py-3">
          Shop Chocolates
        </Link>
      </div>
    </motion.div>
  </div>
);

export default NotFound;
