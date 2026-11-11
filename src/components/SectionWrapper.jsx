// Consistent card wrapper for page content; the title becomes the page's only <h1>.
export default function SectionWrapper({ title, children, className = '' }) {
  return (
    <section className={`tab-content content-visible ${className}`}>
      {title && <h1>{title}</h1>}
      {children}
    </section>
  );
}
