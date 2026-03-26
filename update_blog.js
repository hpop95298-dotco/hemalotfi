const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const content = `
<h1 class='text-4xl font-bold mb-8 text-primary'>🚀 The Future of AI, Cybersecurity & Digital Transformation</h1>
<p class='text-lg leading-relaxed mb-6'>In today’s fast-paced digital world, technology is no longer just a tool — it has become the foundation of every successful business. Companies that embrace innovation are the ones that lead the future.</p>
<p class='text-lg leading-relaxed mb-6'>At Quantix Software Company, we are committed to building intelligent, secure, and scalable solutions that empower businesses to grow, innovate, and succeed in an increasingly competitive environment.</p>
<hr class='my-10 border-white/10' />
<h2 class='text-2xl font-bold mb-4 flex items-center gap-2'>🤖 Artificial Intelligence: The Engine of Innovation</h2>
<p class='mb-4'>Artificial Intelligence (AI) is transforming industries across the globe. From automating repetitive tasks to enabling predictive decision-making, AI is redefining how businesses operate.</p>
<ul class='list-disc list-inside space-y-2 mb-6 ml-4'>
  <li>Automate workflows and reduce manual effort</li>
  <li>Analyze large volumes of data بسرعة ودقة</li>
  <li>Enhance customer experience through personalization</li>
  <li>Make smarter, data-driven decisions</li>
</ul>
<p class='italic text-gray-400 mb-6'>AI is no longer a futuristic concept — it is a present-day necessity.</p>
<hr class='my-10 border-white/10' />
<h2 class='text-2xl font-bold mb-4'>📊 Data Science: Turning Data into Power</h2>
<p class='mb-6'>Data is one of the most valuable assets any organization can have. However, raw data alone is not enough — the real value lies in how it is analyzed and utilized.</p>
<ul class='list-disc list-inside space-y-2 mb-6 ml-4'>
  <li>Understand customer behavior and needs</li>
  <li>Optimize performance and operations</li>
  <li>Predict trends and future outcomes</li>
  <li>Gain a competitive advantage</li>
</ul>
<p class='text-lg mb-6'>At Quantix, we specialize in transforming complex data into clear, actionable insights.</p>
<hr class='my-10 border-white/10' />
<h2 class='text-2xl font-bold mb-4'>🔐 Cybersecurity: Protecting the Digital World</h2>
<p class='mb-6'>As digital transformation accelerates, cybersecurity becomes more critical than ever. With increasing threats and vulnerabilities, businesses must prioritize the protection of their systems and data.</p>
<div class='bg-white/5 p-6 rounded-xl mb-6'>
<p class='font-bold mb-2'>Effective cybersecurity ensures:</p>
<ul class='list-disc list-inside space-y-1'>
  <li>Protection of sensitive information</li>
  <li>Secure applications and infrastructure</li>
  <li>Prevention of cyber attacks</li>
  <li>Trust and reliability for users</li>
</ul>
</div>
<p class='font-bold text-secondary text-center text-lg'>Security is not an optional feature — it is a core requirement.</p>
<hr class='my-10 border-white/10' />
<h2 class='text-2xl font-bold mb-4'>🌐 Modern Web & Application Development</h2>
<p class='mb-6'>Modern businesses rely heavily on web and mobile applications to interact with customers and deliver services.</p>
<p class='mb-4 font-semibold'>Building high-quality applications requires:</p>
<ul class='list-disc list-inside space-y-2 mb-8 ml-4'>
  <li>Scalable and efficient architectures</li>
  <li>Clean and maintainable code</li>
  <li>Fast performance and responsiveness</li>
  <li>Attractive and user-friendly design</li>
</ul>
<p class='mb-6'>At Quantix, we focus on creating digital products that are not only functional but also visually engaging and high-performing.</p>
<hr class='my-10 border-white/10' />
<h2 class='text-2xl font-bold mb-4'>⚙️ Integration: The Real Power</h2>
<p class='mb-6'>What truly sets modern companies apart is their ability to integrate multiple technologies into one seamless system.</p>
<div class='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
  <div class='bg-primary/10 p-4 rounded-lg border border-primary/20'>AI + Data → <strong>Smart Systems</strong></div>
  <div class='bg-secondary/10 p-4 rounded-lg border border-secondary/20'>Security + Engineering → <strong>Reliable Platforms</strong></div>
  <div class='bg-accent/10 p-4 rounded-lg border border-accent/20'>Design + Performance → <strong>Exceptional Experience</strong></div>
</div>
<hr class='my-10 border-white/10' />
<h2 class='text-2xl font-bold mb-8 text-center'>🎯 Conclusion</h2>
<p class='text-center text-xl mb-12'>The future belongs to businesses that embrace technology, innovation, and security. Companies that invest in AI, data, and digital transformation today will be the leaders of tomorrow.</p>
<p class='text-center text-primary font-bold text-2xl mb-12'>At Quantix Software Company, we are proud to be part of this transformation.</p>
<div class='bg-secondary p-8 rounded-2xl text-black'>
  <h3 class='text-2xl font-bold mb-4 underline text-black'>✨ About Quantix</h3>
  <p class='mb-4 text-black font-semibold'>Quantix is a forward-thinking software company specializing in AI, Data Science, Cybersecurity, and Full-Stack Development.</p>
  <p class='font-bold italic text-black'>Our mission is to turn ideas into powerful digital realities.</p>
</div>
`;

async function run() {
  try {
    await client.connect();
    const slug = 'future-of-ai-cybersecurity-digital-transformation';
    const res = await client.query('UPDATE posts SET content = $1 WHERE slug = $2', [content, slug]);
    console.log('Update result:', res.rowCount > 0 ? 'SUCCESS' : 'NOT_FOUND');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
