import type { Metadata } from "next"
import { ActorView } from "./actor-view"

export const metadata: Metadata = { title: "Patient Role Player — Aegis Medic" }

interface Props {
  params: Promise<{ token: string }>
}

export default async function ActorPage({ params }: Props) {
  const { token } = await params
  return <ActorView token={token.toUpperCase()} />
}
