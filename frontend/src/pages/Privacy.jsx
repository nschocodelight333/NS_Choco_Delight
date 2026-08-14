const Privacy = () => (
  <div className="py-16 min-h-screen">
    <div className="page-container max-w-3xl">
      <h1 className="font-display text-4xl font-bold text-choco-900 mb-8">Privacy Policy</h1>
      <p className="text-choco-500 text-sm mb-8">Last updated: June 2025</p>

      {[
        {
          title: '1. Information We Collect',
          content: 'We collect information you provide directly, including your name, email address, phone number, and delivery address when you create an account or place an order. We also collect payment information processed securely through Razorpay (we do not store card numbers or UPI IDs).',
        },
        {
          title: '2. How We Use Your Information',
          content: 'We use your information to process and fulfill your orders, send order confirmations and updates, provide customer support, and improve our products and services. We do not sell or rent your personal information to third parties.',
        },
        {
          title: '3. Data Security',
          content: 'We take data security seriously. Passwords are hashed using industry-standard encryption. All payment transactions are processed by Razorpay using bank-level security. Your personal data is stored on secure MongoDB Atlas servers.',
        },
        {
          title: '4. Cookies',
          content: 'We use cookies and local storage to keep you logged in and remember your cart. You can disable cookies in your browser settings, but this may affect functionality.',
        },
        {
          title: '5. Third-Party Services',
          content: 'We use Razorpay for payment processing and Cloudinary for image storage. These services have their own privacy policies. We use these services only to provide our services to you.',
        },
        {
          title: '6. Your Rights',
          content: 'You can request access to, correction of, or deletion of your personal data by contacting us. You can update your profile information at any time through your account settings.',
        },
        {
          title: '7. Contact',
          content: 'If you have any questions about this Privacy Policy, please contact us via our Contact page.',
        },
      ].map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="font-display text-xl font-bold text-choco-900 mb-3">{section.title}</h2>
          <p className="text-choco-700 leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  </div>
);

export default Privacy;
