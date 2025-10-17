import { useHandleStripeReturn } from '@/hooks/useHandleStripeReturn';

export default function CheckoutCancel() {
  useHandleStripeReturn();

  return (
    <div className="p-6 text-white">
      Cancelamento concluído. Voltando ao jogo e atualizando seu acesso… ⏳
    </div>
  );
}
