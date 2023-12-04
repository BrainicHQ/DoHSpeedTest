# DNS Speed Test

Welcome to the **DNS Speed Test** tool! This innovative web application, accessible
at [https://dnsspeedtest.online/](https://dnsspeedtest.online/), is uniquely engineered to optimize your internet
experience by identifying the fastest DNS server tailored to your specific location. In an era where internet speed is
crucial, our tool stands out by performing real-time DNS server evaluations directly from your browser. It's not just
about finding the fastest DNS; it's about ensuring a secure and efficient browsing experience. By leveraging the power
of DNS over HTTPS (DoH) in a client-side application, we offer an unparalleled combination of speed, security, and
user-centric design. Dive into an enhanced internet experience where performance and privacy go hand in hand.

## 🚀 Introduction

In today's digital era, speed and security are paramount. The DNS Speed Test tool isn't just a utility; it's a pivotal
solution for achieving a faster and more reliable internet connection by testing various DNS servers in real time.

## 💡 Features

- **Real-time DNS Testing**: Pinpoints the fastest DNS server based on real-time data for your location.
- **Customizable Tests**: Tailor your testing by adding or removing websites.
- **Detailed Analytics**: Gain deep insights with min, median, and max response times.
- **Interactive Data Visualization**: Charts and graphs for clear, engaging data representation.
- **Adaptive Design**: Seamless experience across different devices.
- **Absolutely Free**: Full access to all features without any cost.

## 🔧 Technical Insights

### Client-Side DNS over HTTPS (DoH) Implementation

Our tool's standout feature is its client-side implementation of DNS over HTTPS (DoH). By running entirely in the user's
browser, it makes DNS queries directly to various DoH-capable DNS servers, bypassing traditional server-side resolution
processes. This approach offers several advantages:

- **Enhanced Privacy and Security**: Unlike typical DNS queries, our client-side DoH requests are encrypted, protecting
  them from interception and tampering.
- **Real-World Accuracy**: By executing from the user's local environment, it provides a more accurate assessment of DNS
  server performance from the user's perspective.
- **Dynamic Request Handling**: Capable of both POST and GET requests, our tool can interact with a broader range of DNS
  servers, including those with strict CORS policies.
- **Reduced Latency**: Eliminates potential server-side processing delays, offering faster, more direct DNS speed
  assessments.

## 📥 Installation

Experience DNS Speed Test locally:

1. Clone the repository: `git clone https://github.com/BrainicHQ/DoHSpeedTest.git`
2. Open `index.html` in your browser to initiate the testing.

## 🤝 Contributing

We welcome contributions to enhance internet speed and security. For issues or feature requests, visit
our [issues page](https://github.com/BrainicHQ/DoHSpeedTest/issues).

## 👤 Author

- [Silviu Stroe](https://github.com/s1lviu/) - Creator and project maintainer.

## ⭐ Support

Enjoying DNS Speed Test? Support the project here:

- [☕ Buy me a coffee](https://www.buymeacoffee.com/silviu)

Your support fuels ongoing improvements and tool accessibility!

## 📜 License

This project is under the GNU General Public License v3.0 - see the [LICENSE](LICENSE).

## ⚠️ Disclaimer

Test results reflect your current network environment and are meant as a guide for choosing DNS servers.

