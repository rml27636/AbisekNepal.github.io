const Stripe = require('stripe');
const stripe = Stripe('your_stripe_secret_key');

const processPayment = async (req, res) => {
  const { amount, currency, token } = req.body; // Token from frontend
  try {
    const charge = await stripe.charges.create({
      amount: amount * 100, // Amount in cents
      currency,
      source: token,
      description: 'LendIt Payment',
    });
    res.json({ message: 'Payment successful', charge });
  } catch (error) {
    res.status(400).json({ error: 'Payment failed', details: error.message });
  }
};

module.exports = { processPayment };
