import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { marked } from "marked";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (authHeader !== "Bearer ziva-super-secret-token-1234") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Deleting existing test blog posts...");
        await prisma.blogPost.deleteMany({});
        console.log("Deleted old blog posts.");

        console.log("Seeding 6 new SEO-optimized blog posts for East Africa...");
        const rawPosts = [
            {
                title: "Bermuda Grass: The Undisputed King of East African Lawns",
                slug: "bermuda-grass-king-of-east-african-lawns",
                excerpt: "If you want a lawn that can survive a Kenyan dry season, laugh in the face of heavy foot traffic, and look like a million bucks, you need Bermuda Grass.",
                content: `Let’s be real for a second. There are a lot of grasses out there. Kikuyu grass grows aggressively, Zimbabwe grass looks neat when you trim it every four minutes, and Paspalum grass has its fans. But if you want a lawn that can survive a Kenyan dry season, laugh in the face of heavy foot traffic, and still look like a million bucks? You’re looking for **Bermuda Grass**.

At **Ziva Landscaping Co.**, we design outdoor spaces that actually thrive in East Africa’s unique climate. When it comes to planting a lawn that works as hard as you do, Bermuda Grass is almost always our first recommendation. Here’s why.

## Why Bermuda Grass Rules the Equator

If grasses had a superhero squad, Bermuda Grass (*Cynodon dactylon*) would be the tank. It is a warm-season grass that thrives in full, blasting sunlight. If your compound in Nairobi, Kampala, or Dar es Salaam doesn't have a lot of shade, Bermuda will absolutely love it.

### 1. Superior Drought Tolerance
Water in East Africa can be a precious (and sometimes scarce) commodity. While other grasses turn crispy yellow the moment the rains stop, Bermuda Grass has an incredibly deep root system. It essentially reaches way down into the earth, grabs whatever moisture it can find, and stays greener for longer. During severe droughts, it might go dormant, but the second the rains return, it bounces back faster than a matatu driver cutting you off on Thika Road.

### 2. High Traffic? No Problem.
Got kids playing football in the yard? Dogs sprinting across the lawn? Are you hosting a chaotic weekend *nyama choma*? Bermuda grass repairs itself incredibly fast. It spreads via creeping runners (both above ground and below ground), meaning any bald patches or divots fill in rapidly.

### 3. Smooth, Carpet-Like Premium Look
When mowed correctly, Bermuda grass creates a dense, premium-looking green carpet. It’s what you often find on professional golf courses across Kenya and Tanzania. It feels incredible under bare feet and provides that pristine, organized look that turns a standard compound into a true luxury landscape design.

## How to Care for Bermuda Grass in East Africa

We’ve established that Bermuda is tough, but it still needs a little love to look its best. At Ziva, we emphasize sustainable and organic landscaping practices.

1.  **Sunlight is Non-Negotiable:** Do not plant Bermuda grass in heavy shade (like right under a massive Mango tree). It needs at least 6-8 hours of direct, unfiltered sunlight a day to thrive.
2.  **Water Deeply, Not Frequently:** Instead of a light sprinkle every evening, give your Bermuda lawn a deep soaking once or twice a week. This trains the roots to grow even deeper, enhancing its drought resistance. We highly recommend installing **drip irrigation systems** to maximize water conservation in larger gardens.
3.  **Keep it Low:** Bermuda grass looks and performs best when kept relatively short (about 1 to 1.5 inches). Frequent mowing encourages the grass to spread horizontally and create that thick, weed-choking carpet.
4.  **Organic Feeding:** Since it grows so vigorously, it can be a hungry grass. Use rich organic compost to feed your lawn. It’s better for the soil, safer for your kids and pets, and entirely aligns with our eco-friendly outdoor solutions.

## The Ziva Landscaping Verdict

If you are planning an upgrade to your outdoor living space and want a functional, beautiful, and highly sustainable lawn, Bermuda Grass is a remarkable choice for the East African climate. It perfectly balances premium aesthetics with rugged durability.

**Ready to upgrade your outdoor space?**
At Ziva Landscaping Co., we don’t just plant grass; we design ecosystems. Whether it's drought-resistant planting, rainwater harvesting, or complete landscape transformations, we are East Africa's trusted landscaping experts.`,
                imageUrl: "/landscape.jpeg",
                published: true,
                publishedAt: new Date(),
            },
            {
                title: "How to Start a Small Kitchen Garden in Nairobi",
                slug: "how-to-start-kitchen-garden-nairobi",
                excerpt: "Turn that empty patch of dirt into an edible landscape! Here is your step-by-step guide to starting a successful kitchen garden in Nairobi or any East African city.",
                content: `Let's face it, the price of Sukuma Wiki and tomatoes at the local *vibanda* isn't what it used to be. But beyond saving a few shillings, there is something incredibly satisfying about walking out your back door, snipping some fresh herbs, and tossing them straight into your cooking pot. 

Welcome to the world of the **Kitchen Garden** (or as we landscape designers like to call it: an *edible landscape*). 

At **Ziva Landscaping Co.**, we believe your outdoor space shouldn't just look pretty—it should work for you. Whether you have a vast quarter-acre in Karen or just a sunny balcony in Kilimani, here is how you can start a thriving kitchen garden in Nairobi.

## 1. Location, Location, Sunlight

Vegetables are divas when it comes to the sun. They demand center stage. Your kitchen garden needs at least **6 to 8 hours of direct sunlight** every day. 

If you plant your tomatoes in the permanent shadow of your house, they will grow tall, thin, and absolutely refuse to fruit. Observe your compound for a day and pick the sunniest spot available. 

## 2. Soil is Everything (Seriously, Everything)

Nairobi soil varies wildly. You might have rich red volcanic soil, or you might have heavy, sticky black cotton soil that turns to concrete in the dry season. 

Regardless of what you start with, **you must add organic matter**. 
*   **Compost:** Start a compost bin for your kitchen scraps. 
*   **Manure:** Well-rotted cow or goat manure works wonders.
*   **Raised Beds:** If your soil is terrible (looking at you, black cotton), build raised beds using stone or reclaimed wood. This gives you complete control over the soil quality and drainage.

We strongly advocate for **organic practices**—skip the synthetic fertilizers. A healthy soil ecosystem full of earthworms and beneficial bacteria will give you healthier, more nutritious vegetables.

## 3. What to Plant (The East African Starters)

Don't start by trying to grow temperamental exotic vegetables. Start with the tough, reliable champions of the East African climate:

*   **The Staples:** Sukuma Wiki (Collard Greens), Spinach, and Nduma (Arrowroot - if you have a naturally wet spot).
*   **The Flavor Makers:** Dhania (Coriander), Rosemary, Thyme, and Mint (plant mint in a pot, otherwise it will take over your entire garden like weeds).
*   **The Heavy Yielders:** Cherry tomatoes, chili peppers, and climbing beans. 

## 4. Water Conservation is Key

Nairobi's dry seasons can be brutal. If your entire gardening strategy relies on city council water pressure, you are going to have a bad time. 

*   **Mulch:** Cover the exposed soil around your plants with dry grass, leaves, or wood chips. This stops the sun from baking the moisture out of the dirt.
*   **Drip Irrigation:** A simple, affordable drip line setup puts water exactly where the plants need it—at the roots—without wasting a drop. 
*   **Rainwater Harvesting:** Even a modest water tank connected to your gutters can save your vegetables during the dry months.

## Need Expert Help?

Designing an edible landscape that blends seamlessly with your premium lawn and outdoor living areas is our specialty at Ziva Landscaping Co. We can help you install raised beds, orchards, and smart irrigation systems. 

Stop buying wilted grocery store herbs. [Contact us today](/company) and let's get planting!`,
                imageUrl: "/garden.jpg",
                published: true,
                publishedAt: new Date(Date.now() - 86400000), // 1 day ago
            },
            {
                title: "5 Drought-Resistant Plants for Your East African Garden",
                slug: "5-drought-resistant-plants-east-africa",
                excerpt: "Tired of your garden dying every January? Discover 5 stunning, drought-resistant plants that thrive in Kenya without driving up your water bill.",
                content: `We all know the cycle. You plant a beautiful, lush garden in April during the long rains. Fast forward to February, the sun is blazing, the water bowser guy is ignoring your calls, and your once-gorgeous plants look like they're auditioning for a desert survival movie.

It doesn’t have to be this way. 

At **Ziva Landscaping Co.**, we champion **Water Conservation** and **Sustainable Landscaping**. The secret to a beautiful garden that survives the East African dry season isn’t watering more—it’s choosing the right plants to begin with.

Here are 5 stunning, drought-resistant plants that will keep your compound looking premium, even when the rain stops.

## 1. Bougainvillea (The Unkillable Classic)

If there was a medal for surviving the Kenyan heat while still looking absolutely fabulous, the Bougainvillea would win gold every year. 

*   **Why it works:** Once established, their root systems are incredibly tough. In fact, slightly stressing a bougainvillea by withholding water actually encourages it to produce *more* flowers.
*   **How to use it:** Train it up a pergola, let it spill over a perimeter wall for added security (those thorns don't joke around), or prune it into a standalone statement bush.

## 2. Aloe Vera (The Functional Succulent)

Succulents are the kings of drought resistance because they literally store water in their fleshy leaves. Aloe Vera is a staple in East African gardens.

*   **Why it works:** It thrives in poor soil and blazing sun. It requires almost zero maintenance.
*   **How to use it:** Perfect for rock gardens or modern, minimalist landscaping designs. Plus, break off a leaf and you have instant, natural relief for minor burns or skin irritation. 

## 3. Agapanthus (The Lily of the Nile)

Want lush green foliage and bursts of purple or white flowers without the high water demands? Agapanthus is your answer.

*   **Why it works:** They have thick, fleshy roots (rhizomes) that store water efficiently. They can survive long dry spells and bounce back beautifully.
*   **How to use it:** They look incredibly premium when planted en masse along driveways, bordering a neat Bermuda grass lawn, or lining a walkway. 

## 4. Lavender & Rosemary (The Scented Survivors)

We group these two together because they share similar Mediterranean origins and absolutely love the dry, sunny conditions found in many parts of Kenya, especially around the Rift Valley and Nairobi.

*   **Why it works:** Their thin, slightly gray-green leaves reduce moisture loss. 
*   **How to use it:** Not only do they smell incredible when you brush past them, but they are highly functional. Use Rosemary in your kitchen garden, and let Lavender attract beneficial pollinators (like bees and butterflies) to enhance your garden's biodiversity. 

## 5. Plumbago (The Blue Beauty)

Often overlooked, the Plumbago bush produces clusters of delicate, pale blue flowers that look almost too pretty to be tough. But don't let the delicate flowers fool you.

*   **Why it works:** It is highly drought-tolerant once established and handles the intense equatorial sun perfectly. 
*   **How to use it:** It works wonderfully as a sprawling ground cover or a loosely pruned hedge separating different zones of your garden.

## Designing a Sustainable Masterpiece

Throwing a few cacti into your yard isn't landscaping. True sustainable landscaping requires carefully balancing these drought-resistant plants with functional spaces, smart irrigation, and premium design.

At Ziva Landscaping Co., we specialize in eco-friendly outdoor solutions that look breathtaking year-round while conserving East Africa’s precious water resources. 

[Reach out to our experts](/company) to design a garden that survives—and thrives—in every season.`,
                imageUrl: "/Rock Garden.jpg",
                published: true,
                publishedAt: new Date(Date.now() - 172800000), // 2 days ago
            },
            {
                title: "Natural Pest Control: Why Planting Herbs is the Secret to a Healthy Compound",
                slug: "natural-pest-control-herbs-landscaping",
                excerpt: "Stop spraying harsh chemicals on your garden! Learn how integrating specific herbs into your landscaping provides organic, natural pest control.",
                content: `There’s a strange irony in modern gardening. We spend weekends planting beautiful flowers and curating premium lawns so we can enjoy nature, and the moment a bug appears, we reach for a plastic bottle of toxic chemicals to nuke the entire ecosystem. 

At **Ziva Landscaping Co.**, we do things differently. We believe in **Organic Practices**. 

If you want to protect your garden—and your family, pets, and local wildlife—the best defense against pests isn't a pesticide sprayer; it’s a carefully planned herbaceous border. By strategically integrating certain strong-smelling herbs into your landscaping, you can naturally repel destructive insects while keeping the beneficial ones (like bees and butterflies) happy. 

Here is how you can use herbs as your garden's natural bouncers.

## The Science of Confusion

Insects largely navigate and find their food through scent. A cabbage moth finds your beautiful Sukuma Wiki by smelling it. When you plant highly aromatic herbs near your vulnerable plants, you essentially create a "scent camouflage." The strong aromatic oils in the herbs confuse and overwhelm the pests' senses, causing them to fly right past your garden looking for an easier meal.

## Top Herbs for Natural Pest Control

### 1. Marigolds (Technically a flower, but functionally an herb!)
If you only plant one natural repellent, make it the Marigold. 
*   **What it repels:** Nematodes (destructive microscopic root worms), whiteflies, and even some species of mosquitoes.
*   **How to use it:** Plant them thickly around the borders of your vegetable garden or intersperse them among your prize ornamentals. Their bright orange and yellow flowers add fantastic visual pop to your landscape design.

### 2. Mint
Mint is aggressive, tough, and highly aromatic.
*   **What it repels:** Ants, aphids, and cabbage moths. 
*   **How to use it:** **WARNING:** Mint is a thug. If you plant it directly in the ground, it will spread via underground runners and conquer your entire garden. *Always* plant mint in pots. You can sink the pots into the soil if you want the grounded look, but keep the roots contained!

### 3. Basil
Not just for pasta! Basil is a warm-weather lover that thrives in the East African sun.
*   **What it repels:** Tomato hornworms, thrips, and it even helps deter flies and mosquitoes.
*   **How to use it:** Basil is the classic companion plant for tomatoes. Planting them together not only protects the tomatoes but is said to improve their flavor. 

### 4. Rosemary
A tough, drought-resistant staple that we recommend for almost every garden.
*   **What it repels:** Cabbage moths, bean beetles, and carrot rust flies.
*   **How to use it:** Rosemary grows into a substantial, woody bush. Use it as a structural element in your landscaping—perhaps flanking a garden bench or lining a sunny pathway.

## Creating a Wildlife-Friendly Ecosystem

By swapping harsh chemicals for natural herbal repellents, you aren't just saving your plants; you are protecting the broader ecosystem. 

Chemical pesticides don't discriminate. When you spray for aphids, you also kill the ladybugs, bees, and butterflies. By using organic practices, you invite beneficial predators back into your garden. Birds will come to eat the caterpillars, and ladybugs will naturally manage the aphid populations. 

This balance is the core of true **sustainable landscaping**.

Want to build an eco-friendly outdoor space that works in harmony with the East African environment? [Contact Ziva Landscaping Co.](/company) to discuss how we can bring organic, vibrant life to your compound.`,
                imageUrl: "/image-1.jpg",
                published: true,
                publishedAt: new Date(Date.now() - 259200000), // 3 days ago
            },
            {
                title: "Hardscaping with Recycled Materials: Unlocking Unique Character",
                slug: "hardscaping-recycled-materials-sustainable-design",
                excerpt: "Reclaimed wood, repurposed stones, and brilliant landscape design. How using recycled materials creates a unique, sustainable, and eco-friendly compound.",
                content: `When we talk about landscaping, our minds immediately go to the "softscape"—the lush Bermuda lawns, the vibrant bougainvillea, the edible kitchen gardens. But the true backbone of any premium outdoor space is the "hardscape." 

Hardscaping refers to the non-living elements of your compound: the pathways, the patios, the retaining walls, and the pergolas. 

At **Ziva Landscaping Co.**, we are passionate about **minimizing waste and maximizing character**. One of the most striking ways to elevate your outdoor space while adhering to eco-friendly practices is to incorporate **recycled and repurposed materials**.

Here’s why stepping away from the standard hardware-store concrete pavers and embracing reclaimed materials can transform your East African compound.

## The Magic of Reclaimed Wood

There is a warmth and texture to old wood that simply cannot be manufactured. Reclaimed wood—salvaged from old barns, vintage railway sleepers, or decommissioned industrial sites—carries history in its grain.

*   **Railway Sleepers for Retaining Walls:** Instead of pouring cold, industrial concrete to terrace a sloped garden, using heavy, weathered railway sleepers adds immense rustical appeal. They are incredibly durable and blend naturally into the greenery.
*   **Pergolas and Seating:** Old, thick timber beams make for stunning overhead pergolas. When draped with climbing vines or passion fruit lines, reclaimed wood structures feel like they have belonged in your garden for decades, avoiding that "sterile new build" look.

## Repurposed Stones and Brick

Why mine new stone when the earth has already provided materials that have stood the test of time?

*   **Broken Concrete "Urban Flagstone":** This is a brilliantly sustainable practice. Instead of tossing broken slabs of old driveway concrete into a landfill, the broken chunks can be flipped and laid out like premium flagstone. When the gaps are filled with creeping thyme or smooth river stones, the result is a striking, modern, and completely recycled patio or walkway.
*   **Salvaged Bricks:** Old red clay bricks have a faded, uneven color palette that modern bricks simply lack. Using them for meandering garden paths or as borders for raised vegetable beds adds an instant classic, vintage charm to your compound.

## The Environmental Impact

Choosing recycled materials isn't just an aesthetic choice; it’s a core component of **sustainable landscaping**. 

Every piece of reclaimed wood or salvaged stone you use means:
1.  **Less Landfill Waste:** You are physically keeping heavy, bulky materials out of local dumpsites.
2.  **Lower Carbon Footprint:** Manufacturing new cement, firing new bricks, and milling new timber requires massive amounts of energy. Reusing materials drastically cuts down the carbon emissions associated with your landscape project.
3.  **Preservation of Natural Habitats:** Using salvaged wood reduces the demand for fresh logging, helping to protect existing forests.

## Perfectly Imperfect

The beauty of recycled materials lies in their imperfection. The slight warp in a timber beam, the faded stamp on an old brick, or the varied colors of repurposed stone ensures that your garden will look entirely unique. No one else will have a patio exactly like yours.

Are you ready to build an outdoor space that is deeply authentic, structurally stunning, and highly sustainable? [Get in touch with Ziva Landscaping Co.](/company) and let's craft a hardscape that tells a story.`,
                imageUrl: "/image-2.jpg",
                published: true,
                publishedAt: new Date(Date.now() - 345600000), // 4 days ago
            },
            {
                title: "Lawn Care Basics: Keeping Your Grass Green During the Dry Season",
                slug: "lawn-care-basics-kenya-dry-season",
                excerpt: "A green lawn in the height of the Kenyan dry season isn't magic; it's proper management. Learn the essential lawn care basics to protect your grass.",
                content: `January and February in East Africa can be ruthless. The skies are clear, the sun is scorching, and the dust settles on everything. For many homeowners, this is the time of year when their beautiful, lush green lawns surrender, turning into prickly yellow mats of despair. 

But it doesn't have to be that way. 

At **Ziva Landscaping Co.**, we know that a green lawn during the dry season isn’t achieved by magic (or by bankrupting yourself with the local water bowser). It is achieved through smart, sustainable **Lawn Care Basics**. 

Here is how you keep your grass vibrant when the rains disappear.

## 1. Train Your Roots to Go Deep

The biggest mistake homeowners make is watering their lawns a little bit, every single evening. 

If you just mist the top layer of soil, the grass roots will stay shallow, clustering at the surface waiting for their daily sprinkle. When a severe hot day hits, that top inch of soil dries out instantly, and your shallow-rooted grass burns.

**The Fix:** Water deeply, but infrequently. Water your lawn heavily 1 to 2 times a week. The water will soak deep into the soil. As the top layer dries out, the grass roots will grow downward, chasing the moisture deep underground. A deep-rooted lawn (especially a tough variety like Bermuda Grass) can easily survive the blazing midday sun.

## 2. Raise Your Mower Blade

It’s tempting to cut your grass extremely short so you don’t have to mow it as often. During the dry season, this is a fatal error.

Short grass exposes the underlying soil directly to the sun. The soil heats up rapidly, the moisture evaporates instantly, and the delicate root crowns of the grass get scorched. 

**The Fix:** Let your grass grow a little taller during the hot months. The taller blades act like an umbrella, casting shade over the soil. This shade keeps the ground significantly cooler and dramatically reduces water evaporation. 

## 3. Embrace the Mulch

When you mow the lawn, do you bag up all the clippings and throw them away? You are throwing away free fertilizer and moisture control!

**The Fix:** Unless the grass is excessively long, leave the clippings on the lawn. This is called "grasscycling." The clippings break down rapidly, returning essential nitrogen and nutrients directly to the soil (supporting our **organic practices**). More importantly, they act as a natural mulch, providing a tiny protective layer over the soil that helps lock in moisture.

## 4. Don't Fertilize During a Drought

If your grass is looking stressed, yellowing, and thirsty, do not dump synthetic fertilizer on it! 

Fertilizer pushes the grass into a rapid growth phase. To grow rapidly, the grass needs massive amounts of water. If you fertilize when the grass is already struggling for moisture, you will literally burn the lawn to the ground. 

**The Fix:** Save the feeding for when the rains return, or use a high-quality organic compost early in the season to improve the soil structure's water-holding capacity.

## Stop Fighting the Climate; Work With It

A premium, healthy lawn in East Africa requires understanding the environment, not fighting it. Implementing rain water harvesting systems and smart drip irrigation can automate this process and save you money in the long run.

Need a professional touch to rescue your lawn or install a sustainable irrigation system? [Contact Ziva Landscaping Co.](/company) – we create sustainable living spaces that work in harmony with nature.`,
                imageUrl: "/image-3.jpg",
                published: true,
                publishedAt: new Date(Date.now() - 432000000), // 5 days ago
            }
        ];

        const posts = await Promise.all(
            rawPosts.map(async (post) => ({
                ...post,
                content: await marked.parse(post.content),
            }))
        );

        await prisma.blogPost.createMany({
            data: posts,
        });

        console.log("Successfully seeded 6 highly SEO-optimized blog posts.");
        return NextResponse.json({ success: true, message: "Blobs seeded successfully" });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
