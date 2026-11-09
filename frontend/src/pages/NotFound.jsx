import { Link } from 'react-router'

export default function NotFound() {
  return (
    <section className="py-20 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <Link to="/" className="mt-4 inline-block text-brand underline">
        Back to home
      </Link>
    </section>
  )
}
