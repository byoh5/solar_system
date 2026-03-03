import { Line } from '@react-three/drei'
import { useMemo } from 'react'

type OrbitRingProps = {
  radius: number
  color?: string
}

export function OrbitRing({ radius, color = '#8aa5ff' }: OrbitRingProps) {
  const points = useMemo(() => {
    const segments = 160
    const calculatedPoints: [number, number, number][] = []

    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2
      calculatedPoints.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius])
    }

    return calculatedPoints
  }, [radius])

  return <Line points={points} color={color} transparent opacity={0.28} />
}
