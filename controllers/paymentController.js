const Stripe = require('stripe');
const stripe = Stripe('your_stripe_secret_key');
const Payment = require('../models/payment');  // Import the Payment model

const processPayment = async (req, res) => {
  const { amount, currency, token } = req.body; // Token from frontend
  
  try {
    // Create a charge using Stripe API
    const charge = await stripe.charges.create({
      amount: amount * 100, // Amount in cents
      currency,
      source: token,
      description: 'LendIt Payment',
    });

    // Store the payment in the database
    const payment = new Payment({
      amount,
      currency,
      status: 'successful',
      chargeId: charge.id
    });

    await payment.save();  // Save the payment document

    res.json({ message: 'Payment successful', charge });
  } catch (error) {
    // If payment fails, store the failed payment attempt
    const payment = new Payment({
      amount,
      currency,
      status: 'failed',
    });

    await payment.save();  // Save the failed payment document

    res.status(400).json({ error: 'Payment failed', details: error.message });
  }
};

module.exports = { processPayment }
