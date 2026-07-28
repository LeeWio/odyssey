"use client";

import { Globe, Heart, Info, Send } from "@gravity-ui/icons";
import {
  Button,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  Surface,
  TextField,
  Typography,
} from "@heroui/react";
import { AnimatePresence, motion } from "motion/react";
import { type FormEvent, useState } from "react";
import Image from "next/image";

import {
  type FriendLinkRequest,
  useApplyFriendLinkMutation,
  useGetPublicFriendLinksQuery,
} from "@/lib/features/friend-link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const MotionSurface = motion.create(Surface);

export default function FriendLinksPage() {
  const { data: links = [], isLoading } = useGetPublicFriendLinksQuery();
  const [applyLink, { isLoading: isApplying }] = useApplyFriendLinkMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FriendLinkRequest>({
    name: "",
    url: "",
    avatar: "",
    description: "",
    email: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await applyLink(formData).unwrap();
      setIsModalOpen(false);
      setFormData({ name: "", url: "", avatar: "", description: "", email: "" });
    } catch {
      // Toast handled in API
    }
  };

  return (
    <div className="bg-background relative min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-20 md:pt-32">
        {/* Hero Section */}
        <div className="mb-20 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Chip
              variant="soft"
              color="accent"
              className="mb-6 px-4 py-1"
              startContent={<Heart className="mr-1 size-3" />}
            >
              Community & Connections
            </Chip>
            <Typography className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Friend <span className="text-accent">Links</span>
            </Typography>
            <Typography className="text-muted mx-auto max-w-2xl text-lg">
              Deep coordinates of elegant engineering and high design. These are the amazing folks
              behind the screens who inspire us every day.
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10"
          >
            <Button
              size="lg"
              variant="primary"
              className="bg-accent text-accent-foreground shadow-accent/20 shadow-lg"
              onPress={() => setIsModalOpen(true)}
            >
              <Send className="mr-2 size-4" />
              Apply for Exchange
            </Button>
          </motion.div>
        </div>

        {/* Links Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" color="accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {links.map((link, index) => (
                <MotionSurface
                  key={link.id}
                  variant="secondary"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="group ring-border/50 hover:shadow-accent/5 relative flex flex-col gap-5 rounded-[2rem] p-6 shadow-sm ring-1 transition-shadow hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="ring-background relative size-16 overflow-hidden rounded-2xl shadow-inner ring-4">
                      {link.avatar ? (
                        <Image
                          fill
                          src={link.avatar}
                          alt={link.name}
                          className="object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="bg-accent/10 text-accent flex h-full w-full items-center justify-center text-xl font-bold">
                          {link.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-background/50 text-muted hover:bg-accent hover:text-accent-foreground flex size-10 items-center justify-center rounded-full transition-all hover:rotate-12"
                    >
                      <Globe className="size-5" />
                    </a>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Typography className="text-lg font-bold tracking-tight">
                      {link.name}
                    </Typography>
                    <Typography className="text-muted line-clamp-2 text-sm">
                      {link.description || "A beautiful corner of the digital world."}
                    </Typography>
                  </div>

                  <div className="mt-auto pt-2">
                    <div className="from-accent/20 h-px w-full bg-gradient-to-r to-transparent" />
                  </div>
                </MotionSurface>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Requirements Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32"
        >
          <Surface variant="secondary" className="rounded-[3rem] p-8 md:p-12">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 text-accent flex size-12 items-center justify-center rounded-2xl">
                    <Info className="size-6" />
                  </div>
                  <Typography className="text-2xl font-bold">Exchange Policy</Typography>
                </div>
                <Typography className="text-muted leading-relaxed">
                  We value high-quality content and elegant design. If your site shares our passion
                  for technology, art, or design, we&apos;d love to connect.
                </Typography>
                <ul className="space-y-4">
                  {[
                    "Content must be original and updated regularly",
                    "No illegal, sensitive, or low-quality content",
                    "HTTPS protocol is preferred for security",
                    "Our link should be added to your site before applying",
                  ].map((item, i) => (
                    <li key={i} className="text-muted flex items-center gap-3 text-sm">
                      <div className="bg-accent size-1.5 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-background/50 ring-border/50 rounded-[2rem] p-8 ring-1">
                <Typography className="mb-6 text-xl font-bold">Our Credentials</Typography>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <Typography className="text-muted text-xs font-semibold tracking-wider uppercase">
                      Name
                    </Typography>
                    <Typography className="font-mono text-sm">Odyssey</Typography>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Typography className="text-muted text-xs font-semibold tracking-wider uppercase">
                      URL
                    </Typography>
                    <Typography className="font-mono text-sm">https://odyssey.com</Typography>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Typography className="text-muted text-xs font-semibold tracking-wider uppercase">
                      Avatar
                    </Typography>
                    <Typography className="truncate font-mono text-sm">
                      https://odyssey.com/avatar.png
                    </Typography>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Typography className="text-muted text-xs font-semibold tracking-wider uppercase">
                      Description
                    </Typography>
                    <Typography className="text-sm">
                      Deep coordinates of elegant engineering.
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </Surface>
        </motion.div>
      </main>

      <Footer />

      {/* Apply Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          variant="blur"
          className="z-[100]"
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="rounded-[2.5rem] border-none shadow-2xl">
              <Modal.CloseTrigger />
              <Form onSubmit={handleSubmit} className="p-2">
                <Modal.Header>
                  <Modal.Heading className="text-2xl font-bold tracking-tight">
                    Apply for Exchange
                  </Modal.Heading>
                  <Typography className="text-muted text-sm">
                    Fill in your site details to request a connection.
                  </Typography>
                </Modal.Header>

                <Modal.Body className="flex flex-col gap-5 py-6">
                  <TextField isRequired name="name">
                    <Label>Site Name</Label>
                    <Input
                      variant="secondary"
                      placeholder="e.g. My Creative Blog"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <FieldError />
                  </TextField>

                  <TextField isRequired name="url">
                    <Label>Site URL</Label>
                    <Input
                      variant="secondary"
                      placeholder="https://example.com"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    <FieldError />
                  </TextField>

                  <TextField name="avatar">
                    <Label>Avatar URL</Label>
                    <Input
                      variant="secondary"
                      placeholder="https://example.com/logo.png"
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    />
                    <FieldError />
                  </TextField>

                  <TextField name="description">
                    <Label>Description</Label>
                    <Input
                      variant="secondary"
                      placeholder="A short intro about your site"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <FieldError />
                  </TextField>

                  <TextField name="email">
                    <Label>Contact Email</Label>
                    <Input
                      variant="secondary"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <FieldError />
                  </TextField>
                </Modal.Body>

                <Modal.Footer className="border-border/50 border-t pt-6">
                  <Button slot="close" variant="tertiary" size="md">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="bg-accent text-accent-foreground"
                    isPending={isApplying}
                  >
                    {({ isPending }) => (
                      <>
                        {isPending && <Spinner size="sm" color="current" />}
                        Submit Application
                      </>
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
