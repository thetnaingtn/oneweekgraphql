import { getCartId } from '@/lib/cart.client';
import useClient from '@/lib/client';
import { useGetCartQuery } from '@/types';
import { GetServerSideProps } from 'next';

interface CartProps {
  cartId: string;
}

export default function Cart({ cartId }: CartProps) {
  const client = useClient();
  const { data } = useGetCartQuery({
    variables: { id: cartId as any },
    client,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="p-8 min-h-screen">
        <div className="mx-auto max-w-xl space-y-8">
          <h1 className="text-4xl">Cart</h1>
          <div>Items: {data?.cart?.totalItems}</div>
          <div className="border-t pt-4 flex justify-between">
            <div>Subtotal</div>
            <div>{data?.cart?.subTotal.formatted}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<CartProps> = async ({
  req,
  res,
}) => {
  const cartId = getCartId({ req, res });

  return { props: { cartId } };
};
