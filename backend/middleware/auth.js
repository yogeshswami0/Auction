import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authentication token, authorization denied' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No authentication token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }
  next();
};

export const isOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'Owner') {
    return res.status(403).json({ message: 'Access denied: Owner role required' });
  }
  next();
};
