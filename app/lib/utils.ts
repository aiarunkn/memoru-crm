export const heatColor = (heat: string) =>
  heat === 'hot' ? 'bg-red-100 text-red-700' :
  heat === 'warm' ? 'bg-amber-100 text-amber-700' :
  'bg-gray-100 text-gray-600'
