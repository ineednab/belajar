import { InfoPage, InfoSection, Paragraph } from '@/components/info-page';

/** Settings → Privacy (PRD §6 Settings, §9.2–9.4). */
export default function PrivacyScreen() {
  return (
    <InfoPage title="Privasi">
      <InfoSection title="Semuanya tetap di HP ini">
        <Paragraph>
          Pudar tidak punya akun dan tidak punya server. Tulisanmu tidak pernah dikirim ke mana pun. Tidak ada
          iklan dan tidak ada pelacakan.
        </Paragraph>
      </InfoSection>

      <InfoSection title="Apa yang disimpan">
        <Paragraph>
          Nama atau panggilan setiap Pudar beserta ikon, warna, dan hari pertama tanpa kontak. Tulisanmu dan
          waktunya, catatan perasaan per hari, draf yang belum disimpan, dan beberapa pengaturan.
        </Paragraph>
      </InfoSection>

      <InfoSection title="Dikunci dengan enkripsi">
        <Paragraph>
          Semua data disimpan terenkripsi. Kuncinya disimpan di Keychain iPhone, dan tanpa kunci itu file
          datanya tidak bisa dibaca.
        </Paragraph>
      </InfoSection>

      <InfoSection title="Pindah ke iPhone baru">
        <Paragraph>
          Datamu ikut pindah lewat backup iCloud atau backup Finder yang dienkripsi. Backup Finder yang tidak
          dienkripsi tidak membawa kuncinya, jadi di iPhone baru Pudar akan mulai dari awal. Tulisan yang
          sudah lewat 30 hari tetap terhapus begitu Pudar dibuka.
        </Paragraph>
      </InfoSection>

      <InfoSection title="Menghapus semuanya">
        <Paragraph>
          Kamu bisa menghapus semua data kapan saja lewat Pengaturan, Hapus semua data. Menghapus aplikasi
          Pudar juga menghapus datanya.
        </Paragraph>
      </InfoSection>
    </InfoPage>
  );
}
