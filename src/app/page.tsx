// src/app/page.tsx
import { ProductCard } from "@/components/ProductCard";

const sections = {
  "For you": [
    {
      id: "1",
      title: "Fresh Basil Leaves",
      user: { name: "Alice", avatar: "https://example.com/alice.jpg" },
      description: "Organic basil leaves from my garden, perfect for pesto or fresh salads.",
      image: "https://images.unsplash.com/photo-1597848216141-7e4e8c32a31e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    },
    {
      id: "2",
      title: "Heirloom Tomatoes",
      user: { name: "Bob" },
      description: "Juicy, flavorful tomatoes from my backyard.",
      image: "https://images.unsplash.com/photo-1607305387299-a3d9611cd469?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    },
  ],
  "Near you": [
    {
      id: "3",
      title: "Homemade Sourdough Starter",
      user: { name: "Clara", avatar: "https://example.com/clara.jpg" },
      description: "Active sourdough starter, fed daily with organic flour.",
      image: "https://images.unsplash.com/photo-1587577973646-5d032e5e8a51?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    },
  ],
  "Trending": [
    {
      id: "4",
      title: "Wild Honey",
      user: { name: "Dave" },
      description: "Raw honey collected from local wildflowers.",
      image: "https://images.unsplash.com/photo-1605600659906-730ab88eecf6?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
    },
  ],
};

export default function HomePage() {
  return (
    <div className="space-y-12 pl-10">
      {Object.entries(sections).map(([sectionTitle, items]) => (
        <section key={sectionTitle}>
          <h2 className="text-2xl font-bold mb-4">{sectionTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                title={item.title}
                user={item.user}
                description={item.description}
                image={item.image}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}