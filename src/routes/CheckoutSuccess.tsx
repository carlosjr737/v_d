import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEntitlement } from '@/hooks/useEntitlement';

export default function CheckoutSuccess() {
  const { refresh } = useEntitlement();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // opcional: ler session_id se quiser auditar/logar
    const sid = params.get('session_id');
    console.debug('Stripe session_id:', sid);

    (async () => {
      try {
        await refresh();      // bate no backend e marca premium
        navigate('/');        // volta para o jogo
      } catch (e) {
        console.error(e);
        // mesmo com erro, não deixe o usuário preso aqui
        navigate('/');
      }
    })();
  }, [params, refresh, navigate]);

  return (
    <div className="p-6 text-white">
      Concluindo seu acesso Premium… ⏳
    </div>
  );
}
