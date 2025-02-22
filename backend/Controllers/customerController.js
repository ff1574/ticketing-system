const db = require("../Util/db");

exports.getCustomerDetails = async (req, res) => {
  try {
    const customerId = req.params.id;

    const [rows] = await db.query(
      "SELECT customer_id, customer_name, customer_email FROM customer WHERE customer_id = ?",
      [customerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer = rows[0];
    res.json(customer);
  } catch (error) {
    console.error("Error retrieving customer details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateCustomerDetails = async (req, res) => {
  try {
    const customerId = req.customerId; // Assuming customerId is extracted from JWT
    const { customerName, customerEmail } = req.body;

    await db.query(
      "UPDATE customer SET customer_name = ?, customer_email = ? WHERE customer_id = ?",
      [customerName, customerEmail, customerId]
    );

    res.json({ message: "Customer details updated successfully" });
  } catch (error) {
    console.error("Error updating customer details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
