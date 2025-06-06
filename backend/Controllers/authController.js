const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../Util/db");

exports.registerCustomer = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[A-Z])/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/^(?=.*\d)/)
    .withMessage("Password must contain at least one number")
    .matches(/^(?=.*[!@#$%^&*(),.?":{}|<>€£¥¢§±`~[\]/\\;=_+-])/)
    .withMessage("Password must contain at least one symbol"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if the user already exists
      const [existingCustomer] = await db.query(
        "SELECT * FROM customer WHERE customer_email = ?",
        [email]
      );
      if (existingCustomer.length > 0) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new customer into the database
      // const [result] = await db.query(
      //   "INSERT INTO customer (customer_name, customer_email, customer_password) VALUES (?, ?, ?)",
      //   [name, email, hashedPassword]
      // );
      // Mock admin insert
      const [result] = await db.query(
        "INSERT INTO administrator (administrator_name, administrator_email, administrator_password, administrator_role) VALUES (?, ?, ?, 'admin')",
        [name, email, hashedPassword]
      );

      // Generate JWT
      const payload = { customer_id: result.insertId };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(201).json({
        message: "Customer registered successfully",
        customerId: result.insertId,
        token,
      });
    } catch (error) {
      console.error("Error registering customer:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];

exports.loginCustomer = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").exists().withMessage("Password is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if the user exists
      const [rows] = await db.query(
        "SELECT * FROM customer WHERE customer_email = ?",
        [email]
      );
      const customer = rows[0];
      if (!customer) {
        return res.status(400).json({ message: "Invalid email" });
      }

      // Validate password
      const isMatch = await bcrypt.compare(
        password,
        customer.customer_password
      );
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }

      // Generate JWT
      const payload = {
        customer_id: customer.customer_id,
        customer_email: customer.customer_email,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ token, customer_id: customer.customer_id });
    } catch (error) {
      console.error("Error logging in customer:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];

exports.loginUser = [
  body("email").isEmail().withMessage("Enter a valid email"),
  body("password").exists().withMessage("Password is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check both tables sequentially
      let user = null;
      let role = "customer";

      // First check customers
      const [customerRows] = await db.query(
        "SELECT * FROM customer WHERE customer_email = ?",
        [email]
      );

      if (customerRows.length > 0) {
        user = customerRows[0];
      } else {
        // Then check administrators
        const [adminRows] = await db.query(
          "SELECT * FROM administrator WHERE administrator_email = ?",
          [email]
        );

        if (adminRows.length > 0) {
          user = adminRows[0];
          role = "admin";
        }
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isMatch = await bcrypt.compare(
        password,
        user.customer_password || user.administrator_password
      );
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Prepare JWT payload
      const payload = {
        user_id: user.customer_id || user.administrator_id,
        email: user.customer_email || user.administrator_email,
        role: role,
      };

      // Generate token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({
        token,
        user_id: payload.user_id,
        email: payload.email,
        role: payload.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
];
