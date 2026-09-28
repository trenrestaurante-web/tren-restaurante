import LoadingScreen from './components/LoadingScreen';
import OrderFlow from './components/OrderFlow';
import { getCorridas, getMenu } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [corridas, menu] = await Promise.all([getCorridas(), getMenu()]);
  return (
    <>
      <LoadingScreen />
      <OrderFlow corridas={corridas} menu={menu} />
    </>
  );
}
