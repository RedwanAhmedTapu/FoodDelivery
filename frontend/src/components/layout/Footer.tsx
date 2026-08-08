export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-zinc-950/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-6 md:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand & Description */}
          <div className="space-y-4">
            <h3 className="font-display text-2xl tracking-tight text-paper">
              Foodie<span className="text-mango">-Bite-</span>Alpha
            </h3>
            <p className="text-sm leading-relaxed text-faint">
              Hot food, tracked door to door. ফরিদপুরের স্বাদে আপনার দোরগোড়ায় পৌঁছে যাক গরম খাবার।
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-paper">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-faint">
              <li><a href="#" className="transition-colors hover:text-mango">Home</a></li>
              <li><a href="#" className="transition-colors hover:text-mango">Menu</a></li>
              <li><a href="#" className="transition-colors hover:text-mango">Track Order</a></li>
              <li><a href="#" className="transition-colors hover:text-mango">About Us</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-paper">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-faint">
              
              {/* Location */}
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-mango" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Faridpur Sadar, Faridpur, Bangladesh</span>
              </li>

              {/* Phone */}
              <li className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0 text-mango" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+8801700000000" className="transition-colors hover:text-mango">+880 1700-000000</a>
              </li>

              {/* Email */}
              <li className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0 text-mango" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@foodiebitealpha.com" className="transition-colors hover:text-mango">info@foodiebitealpha.com</a>
              </li>

            </ul>
          </div>

          {/* Map Location (Faridpur Sadar) */}
          <div className="overflow-hidden rounded-lg border border-border shadow-lg shadow-black/20 h-full min-h-[180px]">
            <iframe
              title="Foodie-Bite-Alpha Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29213.64745!2d89.828!3d23.6065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fe20f1bfb1f5d1%3A0xd8e3d42a737b1a90!2sFaridpur%20Sadar%20Upazila!5e0!3m2!1sen!2sbd!4v1690000000000!5m2!1sen!2sbd"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} Foodie-Bite-Alpha. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-mango">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-mango">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}