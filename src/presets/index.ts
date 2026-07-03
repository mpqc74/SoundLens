export type Preset = {
  id: string
  name: string
  bands: number[]
  rangeMin: number
  rangeMax: number
  gridInterval: number
}

export const iso10: Preset = {
  id: 'iso10',
  name: 'Computer/software — 10-band ISO',
  bands: [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
  rangeMin: -12,
  rangeMax: 12,
  gridInterval: 3,
}

export const sony7: Preset = {
  id: 'sony7',
  name: 'TV — graphic EQ (Sony-style)',
  bands: [125, 250, 500, 1000, 2000, 4000, 8000],
  rangeMin: -12,
  rangeMax: 12,
  gridInterval: 3,
}

export const tcl7: Preset = {
  id: 'tcl7',
  name: 'TV — graphic EQ (TCL-style)',
  bands: [100, 200, 500, 1000, 2000, 5000, 10000],
  rangeMin: -10,
  rangeMax: 10,
  gridInterval: 5,
}

export const tesla5: Preset = {
  id: 'tesla5',
  name: 'Tesla',
  bands: [30, 100, 350, 1300, 5500],
  rangeMin: -8,
  rangeMax: 8,
  gridInterval: 4,
}

export const presets: Preset[] = [iso10, sony7, tcl7, tesla5]
