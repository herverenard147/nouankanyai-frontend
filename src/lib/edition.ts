/**
 * Deux plateformes, une seule base de code (`VITE_EDITION`) :
 * - `cnid` : candidature CNID, le volet ménage (inscription gratuite en pilote) est ouvert ;
 * - toute autre valeur ou aucune (défaut, « nouankany ») : plateforme présentée à l'ESATIC, PME et Industrie seulement,
 *   conformément au plan d'affaires. Aucun ménage n'est proposé à l'inscription ni sur la page d'accueil.
 * Fonction (et non constante) pour que les tests puissent changer la valeur.
 */
export const isCnidEdition = (): boolean =>
  import.meta.env.VITE_EDITION === "cnid";
